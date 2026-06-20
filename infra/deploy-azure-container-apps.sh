#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-NemoSyn}"
LOCATION="${AZURE_LOCATION:-eastus}"
PROJECT_SLUG="${PROJECT_SLUG:-nemosyn}"
ACR_NAME="${AZURE_ACR_NAME:-}"
ENV_NAME="${AZURE_CONTAINERAPP_ENV:-${PROJECT_SLUG}-env}"
WEB_APP_NAME="${AZURE_WEB_APP_NAME:-${PROJECT_SLUG}-web}"
WORKER_APP_NAME="${AZURE_WORKER_APP_NAME:-${PROJECT_SLUG}-worker}"
LOG_ANALYTICS_NAME="${AZURE_LOG_ANALYTICS_NAME:-${PROJECT_SLUG}-logs}"
REDIS_APP_NAME="${AZURE_REDIS_APP_NAME:-${PROJECT_SLUG}-redis}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
ENV_FILE="${ENV_FILE:-apps/web/.env}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "required command not found: $1" >&2
    exit 1
  fi
}

load_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "required environment variable is missing: $name" >&2
    exit 1
  fi
}

secret_arg() {
  local name="$1"
  local value="$2"
  if [[ -n "$value" ]]; then
    printf '%s=%s' "$name" "$value"
  fi
}

require_command az
load_env_file

require_env NEXT_PUBLIC_SUPABASE_URL
require_env NEXT_PUBLIC_SUPABASE_ANON_KEY
require_env SUPABASE_SERVICE_ROLE_KEY
require_env GOOGLE_API_KEY
require_env PINECONE_API_KEY
require_env PINECONE_INDEX_NAME
require_env MNEMOSYNE_SETTINGS_ENCRYPTION_KEY

az extension add --name containerapp --upgrade --yes >/dev/null

if [[ -z "$ACR_NAME" ]]; then
  EXISTING_ACR="$(az acr list --resource-group "$RESOURCE_GROUP" --query '[0].name' -o tsv 2>/dev/null || true)"
  if [[ -n "$EXISTING_ACR" ]]; then
    ACR_NAME="$EXISTING_ACR"
  else
    SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
    SUBSCRIPTION_SUFFIX="$(printf '%s' "$SUBSCRIPTION_ID" | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]' | cut -c1-8)"
    ACR_NAME="${PROJECT_SLUG}${SUBSCRIPTION_SUFFIX}acr"
  fi
fi

echo "Creating resource group $RESOURCE_GROUP in $LOCATION"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "Creating Azure Container Registry $ACR_NAME"
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output none
fi

ACR_LOGIN_SERVER="$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)"
WEB_IMAGE="$ACR_LOGIN_SERVER/$WEB_APP_NAME:$IMAGE_TAG"
WORKER_IMAGE="$ACR_LOGIN_SERVER/$WORKER_APP_NAME:$IMAGE_TAG"

echo "Building and pushing web image $WEB_IMAGE"
az acr build \
  --registry "$ACR_NAME" \
  --image "$WEB_APP_NAME:$IMAGE_TAG" \
  --target web \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  .

echo "Building and pushing worker image $WORKER_IMAGE"
az acr build \
  --registry "$ACR_NAME" \
  --image "$WORKER_APP_NAME:$IMAGE_TAG" \
  --target worker \
  .

echo "Creating Log Analytics workspace $LOG_ANALYTICS_NAME"
az monitor log-analytics workspace create \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" \
  --location "$LOCATION" \
  --output none

LOG_ANALYTICS_ID="$(az monitor log-analytics workspace show --resource-group "$RESOURCE_GROUP" --workspace-name "$LOG_ANALYTICS_NAME" --query customerId -o tsv)"
LOG_ANALYTICS_KEY="$(az monitor log-analytics workspace get-shared-keys --resource-group "$RESOURCE_GROUP" --workspace-name "$LOG_ANALYTICS_NAME" --query primarySharedKey -o tsv)"

if ! az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "Creating Container Apps environment $ENV_NAME"
  az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --logs-workspace-id "$LOG_ANALYTICS_ID" \
    --logs-workspace-key "$LOG_ANALYTICS_KEY" \
    --output none
fi

ACR_USERNAME="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASSWORD="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"

echo "Creating or updating private Redis Container App $REDIS_APP_NAME"
if ! az containerapp show --name "$REDIS_APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az containerapp create \
    --name "$REDIS_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image redis:7-alpine \
    --target-port 6379 \
    --ingress internal \
    --transport tcp \
    --min-replicas 1 \
    --max-replicas 1 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --output none
else
  az containerapp update \
    --name "$REDIS_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image redis:7-alpine \
    --output none
fi

REDIS_FQDN="$(az containerapp show --name "$REDIS_APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"
REDIS_URL="redis://$REDIS_FQDN:6379"

COMMON_SECRETS=(
  "supabase-service-role-key=$SUPABASE_SERVICE_ROLE_KEY"
  "google-api-key=$GOOGLE_API_KEY"
  "pinecone-api-key=$PINECONE_API_KEY"
  "settings-encryption-key=$MNEMOSYNE_SETTINGS_ENCRYPTION_KEY"
)

if [[ -n "${GOOGLE_GENERATIVE_AI_API_KEY:-}" ]]; then
  COMMON_SECRETS+=("google-generative-ai-api-key=$GOOGLE_GENERATIVE_AI_API_KEY")
fi

if [[ -n "${LANGSMITH_API_KEY:-}" ]]; then
  COMMON_SECRETS+=("langsmith-api-key=$LANGSMITH_API_KEY")
fi

WEB_ENV_VARS=(
  "NODE_ENV=production"
  "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "REDIS_URL=$REDIS_URL"
  "GOOGLE_API_KEY=secretref:google-api-key"
  "SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key"
  "PINECONE_API_KEY=secretref:pinecone-api-key"
  "PINECONE_INDEX_NAME=$PINECONE_INDEX_NAME"
  "MNEMOSYNE_SETTINGS_ENCRYPTION_KEY=secretref:settings-encryption-key"
  "MNEMOSYNE_EMBEDDING_MODEL=${MNEMOSYNE_EMBEDDING_MODEL:-gemini-embedding-001}"
)

WORKER_ENV_VARS=(
  "NODE_ENV=production"
  "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
  "SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
  "REDIS_URL=$REDIS_URL"
  "GOOGLE_API_KEY=secretref:google-api-key"
  "SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key"
  "PINECONE_API_KEY=secretref:pinecone-api-key"
  "PINECONE_INDEX_NAME=$PINECONE_INDEX_NAME"
  "MNEMOSYNE_SETTINGS_ENCRYPTION_KEY=secretref:settings-encryption-key"
  "MNEMOSYNE_EMBEDDING_MODEL=${MNEMOSYNE_EMBEDDING_MODEL:-gemini-embedding-001}"
  "INGESTION_WORKER_CONCURRENCY=${INGESTION_WORKER_CONCURRENCY:-2}"
)

if [[ -n "${GOOGLE_GENERATIVE_AI_API_KEY:-}" ]]; then
  WEB_ENV_VARS+=("GOOGLE_GENERATIVE_AI_API_KEY=secretref:google-generative-ai-api-key")
  WORKER_ENV_VARS+=("GOOGLE_GENERATIVE_AI_API_KEY=secretref:google-generative-ai-api-key")
fi

if [[ -n "${LANGSMITH_API_KEY:-}" ]]; then
  WEB_ENV_VARS+=("LANGSMITH_API_KEY=secretref:langsmith-api-key")
  WORKER_ENV_VARS+=("LANGSMITH_API_KEY=secretref:langsmith-api-key")
fi

deploy_app() {
  local app_name="$1"
  local image="$2"
  local ingress="$3"
  local target_port="$4"
  shift 4
  local env_vars=("$@")

  if ! az containerapp show --name "$app_name" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Creating Container App $app_name"
    local create_args=(
      --name "$app_name"
      --resource-group "$RESOURCE_GROUP"
      --environment "$ENV_NAME"
      --image "$image"
      --registry-server "$ACR_LOGIN_SERVER"
      --registry-username "$ACR_USERNAME"
      --registry-password "$ACR_PASSWORD"
      --secrets "${COMMON_SECRETS[@]}"
      --env-vars "${env_vars[@]}"
      --min-replicas 1
      --max-replicas 1
      --cpu 0.5
      --memory 1Gi
      --output none
    )
    if [[ "$ingress" != "none" ]]; then
      create_args+=(--ingress "$ingress" --target-port "$target_port")
    fi
    az containerapp create "${create_args[@]}"
  else
    echo "Updating Container App $app_name"
    az containerapp secret set \
      --name "$app_name" \
      --resource-group "$RESOURCE_GROUP" \
      --secrets "${COMMON_SECRETS[@]}" \
      --output none
    az containerapp update \
      --name "$app_name" \
      --resource-group "$RESOURCE_GROUP" \
      --image "$image" \
      --set-env-vars "${env_vars[@]}" \
      --output none
  fi
}

deploy_app "$WEB_APP_NAME" "$WEB_IMAGE" external 3000 "${WEB_ENV_VARS[@]}"
deploy_app "$WORKER_APP_NAME" "$WORKER_IMAGE" none 0 "${WORKER_ENV_VARS[@]}"

WEB_FQDN="$(az containerapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"

echo "Deployment complete"
echo "Resource group: $RESOURCE_GROUP"
echo "ACR: $ACR_NAME"
echo "Web app: https://$WEB_FQDN"
echo "Worker app: $WORKER_APP_NAME"
