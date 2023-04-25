# NOTE: Testing Only. DO NOT use this in production

ARG NODE_VERSION=18-alpine

# FROM node:${NODE_VERSION}
FROM node:18-alpine AS builder

ARG GITLAB_PIPELINE_TOKEN
ARG CI_API_V4_URL
ARG PAYMENT_EXTENSION
ARG CHAT_EXTENSION
ARG LEAD_EXTENSION
ARG COLAB_EXTENSION
ARG CUSTOM_EXTENSION

RUN export GITLAB_PIPELINE_TOKEN=${GITLAB_PIPELINE_TOKEN}
RUN export CI_API_V4_URL=${CI_API_V4_URL}

RUN apk update
RUN apk --no-cache add --virtual builds-deps build-base python3 openssh-client bash git openssh curl wget
RUN apk add nano

# syntax=docker/dockerfile:1.4

####################################################################################################
## Build Packages

WORKDIR /directus

ENV NODE_OPTIONS=--max-old-space-size=8192

COPY package.json .
RUN corepack enable && corepack prepare

COPY pnpm-lock.yaml .
RUN pnpm fetch
COPY . .
RUN pnpm install --recursive --offline --no-frozen-lockfile

RUN : \
	&& npm_config_workspace_concurrency=1 pnpm run build \
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

RUN ls -al /directus/dist

FROM node:18-alpine AS runtime

ARG GITLAB_PIPELINE_TOKEN
ARG CI_API_V4_URL
ARG PAYMENT_EXTENSION
ARG CHAT_EXTENSION
ARG LEAD_EXTENSION
ARG COLAB_EXTENSION
ARG CUSTOM_EXTENSION

RUN export GITLAB_PIPELINE_TOKEN=${GITLAB_PIPELINE_TOKEN}
RUN export CI_API_V4_URL=${CI_API_V4_URL}

RUN apk update
RUN apk --no-cache add --virtual builds-deps build-base python3 openssh-client bash git openssh curl wget
RUN apk add nano

USER node

WORKDIR /directus

EXPOSE 8055

ENV \
	DB_CLIENT="sqlite3" \
	DB_FILENAME="/directus/database/database.sqlite" \
	EXTENSIONS_PATH="/directus/extensions" \
	STORAGE_LOCAL_ROOT="/directus/uploads" \
	NODE_ENV="production" \
	NPM_CONFIG_UPDATE_NOTIFIER="false"

# Not sure why we have this folder here
RUN rm -rf /directus/api/extensions/modules/__MACOSX || true

COPY --from=builder --chown=node:node /directus/dist .
COPY ./*_extensions.sh .

USER root

RUN chmod +x ./custom_extensions.sh
RUN chmod +x ./payment_extensions.sh
RUN chmod +x ./chat_extensions.sh
RUN chmod +x ./leads_extensions.sh
RUN chmod +x ./crawless_colab_extensions.sh

RUN if [[ -z "$CUSTOM_EXTENSION" ]] ; then echo "Custom extension disabled" ; else ./custom_extensions.sh ; fi
RUN if [[ -z "$PAYMENT_EXTENSION" ]] ; then echo "Payment extension disabled" ; else ./payment_extensions.sh ; fi
RUN if [[ -z "$CHAT_EXTENSION" ]] ; then echo "Chat extension disabled" ; else ./chat_extensions.sh ; fi
RUN if [[ -z "$LEAD_EXTENSION" ]] ; then echo "Lead extension disabled" ; else ./leads_extensions.sh ; fi
RUN if [[ -z "$COLAB_EXTENSION" ]] ; then echo "Colab extension disabled" ; else ./crawless_colab_extensions.sh ; fi

RUN chown -R node:node /directus

USER node

RUN mkdir -p ./uploads
RUN mkdir -p ./snapshots

CMD : \
	&& node --trace-warnings /directus/cli.js bootstrap \
	&& node --trace-warnings /directus/cli.js start \
	;
