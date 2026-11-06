FROM workspace-base

WORKDIR /workspace/packages/embed

COPY packages/embed/assets/ ./assets/
COPY packages/embed/config/ ./config/
COPY packages/embed/public/ ./public/
COPY packages/embed/src/ ./src/
COPY packages/embed/tsconfig.json ./tsconfig.json
COPY packages/embed/webpack/ ./webpack/
COPY packages/logger/src/ /workspace/packages/logger/src/
COPY packages/web-app-utils/src/ /workspace/packages/web-app-utils/src/

EXPOSE 3001

CMD ["pnpm", "run", "start-react:watch"]
