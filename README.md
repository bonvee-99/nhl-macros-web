# nhl-macros-web

## [See live](https://sports-macros.benvinnick.com)

## Features
- select your team, macro symbol, and ordering
- macros for every player plus the head coach (`{code}hc`, `{code}{code}hc`)
- click to copy and you are ready to go!

## Tech Stack
- React, TypeScript, Vite, AWS (Lambda + API Gateway + S3), Terraform

## Layout
- `src/` — React app (`App.tsx` UI, `api.ts` API calls, `macros.ts` macro generation)
- `lambdas/` — one Lambda handler per route (`teams`, `roster`, `coach`); plain Node, no dependencies
- `infra/` — Terraform for the Lambdas, HTTP API Gateway, and the site's S3 bucket
- `scripts/local-api.mjs` — runs the Lambda handlers locally behind a tiny HTTP server

## Local development
- `npm install`
- `npm run dev` — Vite dev server at http://localhost:5173, using the prod API
- Full local stack (no AWS):
  - `npm run dev:api` — local API at http://localhost:3000 (`/teams`, `/roster?tricode=VAN`, `/coach?tricode=VAN`)
  - `npm run dev:local` — Vite dev server pointed at the local API

## Deploying
```sh
terraform -chdir=infra init   # first time only
npm run deploy                # builds the site, then terraform apply (lambdas, API, bucket + site files)
```
Terraform only touches what changed, e.g. editing `lambdas/coach.mjs` redeploys just that function.
- the default API URL in `src/api.ts` should match `terraform -chdir=infra output api_url`
- DNS + HTTPS are handled by Cloudflare, which proxies the domain to the bucket's S3 website
  endpoint (`sports-macros.benvinnick.com.s3-website-us-west-1.amazonaws.com`). The bucket name
  must match the domain for this to work.

## TODO
- [ ] GitHub Actions: `npm run deploy` on push to `main`, `terraform plan` on PRs
  - move Terraform state to an S3 backend (`terraform init -migrate-state`)
  - auth via GitHub OIDC → IAM role with `infra/deployer-policy.json` (no AWS keys stored in GitHub)
- [ ] delete the old setup once the new one is confirmed: REST API `0d27ux40wd`, lambdas
  `getTeams`/`getRoster`/`getCoach`, the `axiosLayer` layer, and the `bonvee-nhl-macros` bucket (if unused)
