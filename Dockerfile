# syntax=docker/dockerfile:1.4

####################################################################################################
## Prepare Workspace

FROM node:18-alpine AS workspace
WORKDIR /workspace

COPY pnpm-lock.yaml .
RUN corepack enable && corepack prepare pnpm@7.30.0 --activate
RUN pnpm fetch
COPY . .
RUN pnpm install --recursive --offline --frozen-lockfile

####################################################################################################
## Create Deployment

FROM workspace AS pruned
WORKDIR /workspace
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN pnpm --recursive --workspace-concurrency=1 run build
RUN pnpm --filter directus deploy --prod pruned
RUN cd pruned \
	&& pnpm pack \
	&& tar -zxvf *.tgz package/package.json \
	&& mv package/package.json package.json \
	&& rm -r *.tgz package \
	&& mkdir database extensions uploads

####################################################################################################
## Create Production Image

FROM node:18-alpine

WORKDIR /directus

EXPOSE 8055

ENV DB_CLIENT="sqlite3"
ENV DB_FILENAME="/directus/database/database.sqlite"
ENV EXTENSIONS_PATH="/directus/extensions"
ENV STORAGE_LOCAL_ROOT="/directus/uploads"
ENV NODE_ENV="production"
ENV NPM_CONFIG_UPDATE_NOTIFIER="false"

COPY --from=pruned --chown=node:node /workspace/pruned .

VOLUME /directus/database
VOLUME /directus/extensions
VOLUME /directus/uploads

USER node

CMD node ./dist/cli/run.js bootstrap \
	&& node ./dist/cli/run.js start
