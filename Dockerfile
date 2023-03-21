# syntax=docker/dockerfile:1.4

####################################################################################################
## Prepare Workspace

FROM node:18-alpine AS workspace
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@7.30.0 --activate

COPY pnpm-lock.yaml .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch

COPY . .
RUN pnpm install --recursive --frozen-lockfile

####################################################################################################
## Create Deployment

FROM workspace AS pruned
WORKDIR /workspace
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN pnpm --recursive run build
RUN pnpm --filter directus deploy --prod pruned

####################################################################################################
## Create Production Image

FROM node:18-alpine
WORKDIR /directus
EXPOSE 8055

ENV \
    DB_CLIENT="sqlite3" \
    DB_FILENAME="/directus/data/database/database.sqlite" \
    EXTENSIONS_PATH="/directus/data/extensions" \
    STORAGE_LOCAL_ROOT="/directus/data/uploads" \
	 NODE_ENV=production

RUN echo "update-notifier=false" >> ~/.npmrc

RUN : \
  mkdir -p \
    /directus/data/database \
    /directus/data/extensions \
    /directus/data/uploads

VOLUME \
  /directus/data/database \
  /directus/data/extensions \
  /directus/data/uploads

USER node

COPY --from=pruned /workspace/pruned/dist dist
COPY --from=pruned /workspace/pruned/package.json package.json
COPY --from=pruned /workspace/pruned/node_modules node_modules

CMD : \
    && node ./dist/cli/run.js bootstrap \
    && node ./dist/cli/run.js start \
    ;
