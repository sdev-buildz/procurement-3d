# syntax=docker/dockerfile:1.7
FROM node:24-trixie-slim AS workspace-base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    npm_config_store_dir=/pnpm/store

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/embed/package.json packages/embed/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY packages/optimizer/package.json packages/optimizer/package.json
COPY packages/procurement/package.json packages/procurement/package.json
COPY packages/web-app-utils/package.json packages/web-app-utils/package.json

RUN --mount=type=cache,id=procurement-3d-pnpm,target=/pnpm/store,sharing=locked \
    pnpm fetch --prod && \
    pnpm install --frozen-lockfile --prefer-offline
