# 0008 Azure Container Apps Deployment

## Context

The user requested the first end-to-end deployment of the current Mnemosyne application to Azure Container Apps using `az`, with all required Azure resources created inside a new resource group named `NemoSyn`. After the manual deployment is verified, the repository should include GitHub Actions automation triggered by pushes to the `staging` branch.

## Domains Touched

- Azure infrastructure for staging deployment.
- Docker packaging for the Next.js web app and BullMQ worker.
- Runtime configuration and secret injection for Supabase, Redis, Google, Pinecone, LangSmith, and Mnemosyne encryption settings.
- CI/CD automation for staging branch deployments.
- Health checks and deployment verification.

## Intended Design

- Use one multi-target root `Dockerfile` with `web` and `worker` production targets so both Container Apps build from the same dependency graph.
- Set `output: "standalone"` for the Next.js app so the web image can run a minimal standalone server.
- Create Azure resources under resource group `NemoSyn`, using an Azure Container Registry for images, a Container Apps environment for workloads, a public web Container App, and a private worker Container App.
- Provide Redis through an Azure resource inside `NemoSyn`; prefer Azure Container Apps-managed container runtime configuration over committing any connection string.
- Inject secrets from local untracked `.env` during the first deployment and from GitHub repository secrets during subsequent staging deployments.
- Avoid committing environment files, secret values, generated build output, or Azure credentials.

## Test Plan

- Create and run a deployment configuration validation script before Docker/workflow implementation; it should fail until the expected files and settings exist.
- Run repository unit tests, typecheck, lint, and production build.
- Build Docker image targets for `web` and `worker`.
- Push the built images to Azure Container Registry.
- Use `az` to verify the `NemoSyn` resource group and required resources exist.
- Verify the web Container App exposes an HTTPS FQDN and responds on `/api/health`.
- Verify the worker Container App is deployed without public ingress.
- Verify the GitHub Actions workflow triggers on push to `staging` and references secrets instead of literal credentials.

## Status

`completed`

## Progress Log

- 2026-06-20 10:55 UTC: Task started. Azure CLI account is authenticated locally. Existing unrelated local changes in `tasks.md` and `0007-supabase-server-key-provisioning.md` were preserved.
- 2026-06-20 10:57 UTC: Added deployment configuration validation script and confirmed it failed before Docker/workflow implementation.
- 2026-06-20 11:03 UTC: Added multi-target Dockerfile, Docker ignore rules, `/api/health`, deployment script, and staging GitHub Actions workflow. Validation, unit tests, typecheck, lint, production build, and local Docker target builds passed.
- 2026-06-20 11:14 UTC: Deployed Azure resources under `NemoSyn`: ACR `nemosyn1a291955acr`, Log Analytics `nemosyn-logs`, Container Apps environment `nemosyn-env`, Redis app `nemosyn-redis`, web app `nemosyn-web`, and worker app `nemosyn-worker`.
- 2026-06-20 11:15 UTC: Verified `https://nemosyn-web.thankfulmeadow-5ba23816.eastus.azurecontainerapps.io/api/health` returns `ok`; verified web revision is healthy and worker is running with no public ingress.

## Verification

- `bash scripts/validate-deployment-config.sh` passed.
- `pnpm test` passed: 11 files, 36 tests.
- `pnpm typecheck` passed for web and worker.
- `pnpm lint` passed.
- `pnpm build` passed and included `/api/health`.
- `docker build --target web ...` passed locally.
- `docker build --target worker ...` passed locally.
- `az acr build --target web` and `az acr build --target worker` passed and pushed images tagged `0a26229`.
- `az resource list --resource-group NemoSyn` showed the expected six resources.
- `curl -fsS https://nemosyn-web.thankfulmeadow-5ba23816.eastus.azurecontainerapps.io/api/health` returned `{"status":"ok","service":"mnemosyne-web",...}`.
- `az containerapp revision list` showed the web revision active and healthy, and the worker revision active with one replica.

## Completion Criteria

- Azure staging deployment is reachable or any Azure-side blocker is documented with concrete command output.
- Dockerfile and deployment automation are committed-ready and verified locally.
- GitHub Actions workflow can deploy the same images on pushes to `staging`.
- No secrets are printed or committed.
