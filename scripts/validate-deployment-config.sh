#!/usr/bin/env bash
set -euo pipefail

failures=0

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "missing file: $path"
    failures=$((failures + 1))
  fi
}

require_contains() {
  local path="$1"
  local pattern="$2"
  local label="$3"

  if [[ ! -f "$path" ]]; then
    echo "cannot check $label; missing file: $path"
    failures=$((failures + 1))
    return
  fi

  if ! grep -Eq "$pattern" "$path"; then
    echo "missing $label in $path"
    failures=$((failures + 1))
  fi
}

require_file "Dockerfile"
require_file ".dockerignore"
require_file "infra/deploy-azure-container-apps.sh"
require_file ".github/workflows/deploy-staging.yml"
require_file "apps/web/app/api/health/route.ts"

require_contains "Dockerfile" "^FROM node:22" "pinned Node 22 base image"
require_contains "Dockerfile" "AS web" "web image target"
require_contains "Dockerfile" "AS worker" "worker image target"
require_contains "apps/web/next.config.ts" "output: \"standalone\"" "Next.js standalone output"
require_contains ".github/workflows/deploy-staging.yml" "branches: \\[staging\\]" "staging push trigger"
require_contains ".github/workflows/deploy-staging.yml" "azure/login" "Azure login action"
require_contains ".github/workflows/deploy-staging.yml" "infra/deploy-azure-container-apps.sh" "shared Azure deploy script"
require_contains "infra/deploy-azure-container-apps.sh" "NemoSyn" "NemoSyn resource group default"

if [[ "$failures" -gt 0 ]]; then
  echo "deployment config validation failed with $failures issue(s)"
  exit 1
fi

echo "deployment config validation passed"
