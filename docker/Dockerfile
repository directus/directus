FROM node:16-alpine as builder

WORKDIR /directus
COPY /dist .
#RUN npm i -g yargs pino pino-colada
RUN npm i --only=production

# Directus image
FROM node:16-alpine

ARG VERSION
ARG REPOSITORY=directus/directus

LABEL directus.version="${VERSION}"
LABEL org.opencontainers.image.source https://github.com/${REPOSITORY}

# Default environment variables
# (see https://docs.directus.io/reference/environment-variables/)
ENV \
  PORT="8055" \
  PUBLIC_URL="/" \
  DB_CLIENT="sqlite3" \
  DB_FILENAME="/directus/database/database.sqlite" \
  RATE_LIMITER_ENABLED="false" \
  RATE_LIMITER_STORE="memory" \
  RATE_LIMITER_POINTS="25" \
  RATE_LIMITER_DURATION="1" \
  CACHE_ENABLED="false" \
  STORAGE_LOCATIONS="local" \
  STORAGE_LOCAL_PUBLIC_URL="/uploads" \
  STORAGE_LOCAL_DRIVER="local" \
  STORAGE_LOCAL_ROOT="/directus/uploads" \
  ACCESS_TOKEN_TTL="15m" \
  REFRESH_TOKEN_TTL="7d" \
  REFRESH_TOKEN_COOKIE_SECURE="false" \
  REFRESH_TOKEN_COOKIE_SAME_SITE="lax" \
  OAUTH_PROVIDERS="" \
  EXTENSIONS_PATH="/directus/extensions" \
  EMAIL_FROM="no-reply@directus.io" \
  EMAIL_TRANSPORT="sendmail" \
  EMAIL_SENDMAIL_NEW_LINE="unix" \
  EMAIL_SENDMAIL_PATH="/usr/sbin/sendmail"

RUN \
  # Install system dependencies
  # - 'bash' for entrypoint script
  # - 'ssmtp' to be able to send mails
  # - 'util-linux' not sure if this is required
  apk upgrade --no-cache && apk add --no-cache \
  bash \
  ssmtp \
  util-linux \
  # Create directory for Directus with corresponding ownership
  # (can be omitted on newer Docker versions since WORKDIR below will do the same)
  && mkdir /directus && chown node:node /directus

# Switch to user 'node' and directory '/directus'
USER node
WORKDIR /directus

COPY --from=builder --chown=node:node /directus .
#COPY --from=builder --chown=node:node /usr/local/lib/node_modules /usr/local/lib/node_modules

RUN \
  # Create data directories
  mkdir -p \
    database \
    extensions/displays \
    extensions/interfaces \
    extensions/layouts \
    extensions/modules \
    uploads
# Expose data directories as volumes
VOLUME \
  /directus/database \
  /directus/extensions \
  /directus/uploads

EXPOSE 8055
CMD npx directus bootstrap && npx directus start
