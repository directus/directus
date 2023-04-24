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

# Required to run OracleDB
# Technically not required for the others, but I'd rather have 1 image that works for all, instead of building n images
# per test
#WORKDIR /tmp
#RUN apk --no-cache add libaio libnsl libc6-compat curl && \
#    curl -o instantclient-basiclite.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip -SL && \
#    unzip instantclient-basiclite.zip && \
#    mv instantclient*/ /usr/lib/instantclient && \
#    rm instantclient-basiclite.zip && \
#    ln -s /usr/lib/instantclient/libclntsh.so.19.1 /usr/lib/libclntsh.so && \
#    ln -s /usr/lib/instantclient/libocci.so.19.1 /usr/lib/libocci.so && \
#    ln -s /usr/lib/instantclient/libociicus.so /usr/lib/libociicus.so && \
#    ln -s /usr/lib/instantclient/libnnz19.so /usr/lib/libnnz19.so && \
#    ln -s /usr/lib/libnsl.so.2 /usr/lib/libnsl.so.1 && \
#    ln -s /lib/libc.so.6 /usr/lib/libresolv.so.2 && \
#    ln -s /lib64/ld-linux-x86-64.so.2 /usr/lib/ld-linux-x86-64.so.2
#
#ENV ORACLE_BASE /usr/lib/instantclient
#ENV LD_LIBRARY_PATH /usr/lib/instantclient
#ENV TNS_ADMIN /usr/lib/instantclient
#ENV ORACLE_HOME /usr/lib/instantclient

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
RUN pnpm install --recursive --offline --frozen-lockfile

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

FROM node:18-alpine AS runtime

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

RUN #chown -R `whoami` ~/.npm
RUN chown -R `whoami` /usr/local/lib/node_modules
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm -r build

RUN export GITLAB_PIPELINE_TOKEN=${GITLAB_PIPELINE_TOKEN}
RUN export CI_API_V4_URL=${CI_API_V4_URL}

RUN chmod +x ./custom_extensions.sh
RUN chmod +x ./payment_extensions.sh
RUN chmod +x ./chat_extensions.sh
RUN chmod +x ./leads_extensions.sh
RUN chmod +x ./crawless_colab_extensions.sh

RUN ./custom_extensions.sh

RUN if [[ -z "$PAYMENT_EXTENSION" ]] ; then echo "Payment extension disabled" ; else ./payment_extensions.sh ; fi
RUN if [[ -z "$CHAT_EXTENSION" ]] ; then echo "Chat extension disabled" ; else ./chat_extensions.sh ; fi
RUN if [[ -z "$LEAD_EXTENSION" ]] ; then echo "Lead extension disabled" ; else ./chat_extensions.sh ; fi
RUN if [[ -z "$COLAB_EXTENSION" ]] ; then echo "Colab extension disabled" ; else ./crawless_colab_extensions.sh ; fi

# Not sure why we have this folder here
RUN rm -rf /directus/api/extensions/modules/__MACOSX || true

COPY ./start_up.sh /directus/api
RUN chmod +x /directus/api/start_up.sh

COPY --from=builder --chown=node:node /directus/dist .

RUN mkdir -p ./uploads
RUN mkdir -p ./snapshots

CMD : \
	&& node /directus/cli.js bootstrap \
	&& node /directus/cli.js start \
	;
