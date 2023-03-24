# syntax=docker/dockerfile:1.4

####################################################################################################
## Prepare Workspace

FROM node:18-alpine AS workspace
WORKDIR /workspace

COPY pnpm-lock.yaml .

RUN corepack enable \
	&& corepack prepare pnpm@7.30.0 --activate \
	&& pnpm fetch

COPY . .

RUN pnpm install --recursive --offline --frozen-lockfile

####################################################################################################
## Create Deployment

FROM workspace AS pruned
WORKDIR /workspace
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN pnpm --recursive run build \
	&& pnpm --filter directus deploy --prod pruned

####################################################################################################
## Create Production Image

FROM node:18-alpine

RUN mkdir /directus \
	&& mkdir -p /directus/data/database /directus/data/extensions /directus/data/uploads \
	&& chown -R node:node /directus/data;

WORKDIR /directus

EXPOSE 8055

ENV DB_CLIENT="sqlite3"
ENV DB_FILENAME="/directus/data/database/database.sqlite"
ENV EXTENSIONS_PATH="/directus/data/extensions"
ENV STORAGE_LOCAL_ROOT="/directus/data/uploads"
ENV NODE_ENV="production"
ENV NPM_CONFIG_UPDATE_NOTIFIER="false"

VOLUME /directus/data/database
VOLUME /directus/data/extensions
VOLUME /directus/data/uploads

COPY --from=pruned /workspace/pruned/dist dist
COPY --from=pruned /workspace/pruned/package.json package.json
COPY --from=pruned /workspace/pruned/node_modules node_modules

USER node

CMD node ./dist/cli/run.js bootstrap \
	&& node ./dist/cli/run.js start
