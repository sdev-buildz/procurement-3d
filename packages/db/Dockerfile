FROM workspace-base

WORKDIR /workspace/packages/db

COPY packages/db/dotenv-configured.ts ./
COPY packages/db/migrations/ ./migrations/
COPY packages/db/prisma/ ./prisma/
COPY packages/db/prisma.config.ts ./

RUN find migrations -mindepth 1 -maxdepth 1 -type d -empty -delete

CMD ["pnpm", "run", "prisma:migrate-prod"]
