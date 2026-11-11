<div align="center">
  <h1>Enterprise Procurement Workspace</h1>
</div>

A 2D React and Node.js application for a global vehicle manufacturer. Buyers and suppliers in Vietnam, India and
China use it every day for supplier onboarding, document compliance, requests for quotation (RFQ) and
approvals. It has a role-based home page, a task inbox, large data grids, long multi-step forms, approval
flows, dashboards and an AI assistant, in English, Vietnamese and Simplified Chinese.

The GraphQL endpoint is available at [https://localhost:443/api/graphql](https://localhost:443/api/graphql).
GraphiQL is hosted at the endpoint.

The 3D editor is hosted as a separate frontend at
[https://localhost:3001](https://localhost:3001) and embedded from
`/sales/editor`. Start it with `pnpm start-embed:watch`.

## Cloudflare deployment

Build and deploy the frontend assets and GraphQL Worker with
`pnpm --filter @packages/enterprise-procurement-workspace run deploy`.
Before deploying, configure `JWE_KEY` as a Wrangler secret (it must be 32
UTF-8 bytes) with
`pnpm --filter @packages/enterprise-procurement-workspace exec wrangler secret put JWE_KEY --config ./cloudflare.jsonc`.
Configure `DATABASE_URL` as a Wrangler secret when the Supabase database is
ready. Set `ORIGIN` and `WEB_CLIENT_ORIGIN` to the deployed site origin so
credentialed API requests pass CORS validation.
