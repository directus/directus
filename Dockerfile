# syntax=docker/dockerfile:1.4

####################################################################################################
## Build Packages

FROM node:18-alpine AS builder
WORKDIR /directus

ENV NODE_OPTIONS=--max-old-space-size=8192

RUN corepack enable && corepack prepare pnpm@7.30.0 --activate

COPY pnpm-lock.yaml .
RUN pnpm fetch
COPY . .
RUN pnpm install --recursive --offline --frozen-lockfile

RUN : \
	&& pnpm --recursive --workspace-concurrency=1 run build \
	&& pnpm --filter directus deploy --prod dist \
	&& cd dist \
	&& pnpm pack \
	&& tar -zxvf *.tgz package/package.json \
	&& mv package/package.json package.json \
	&& rm -r *.tgz package \
	&& mkdir -p database extensions uploads \
	;

####################################################################################################
## Create Production Image

FROM node:18-alpine AS runtime

WORKDIR /directus

EXPOSE 8055

ENV \
	DB_CLIENT="sqlite3" \
	DB_FILENAME="/directus/database/database.sqlite" \
	EXTENSIONS_PATH="/directus/extensions" \
	STORAGE_LOCAL_ROOT="/directus/uploads" \
	NODE_ENV="production" \
	NPM_CONFIG_UPDATE_NOTIFIER="false"

COPY --from=builder --chown=node:node /directus/dist .

USER node

CMD : \
	&& node /directus/dist/cli/run.js bootstrap \
	&& node /directus/dist/cli/run.js start \
	;
