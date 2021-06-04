FROM node:14-alpine

ARG VERSION
ARG REPOSITORY=directus/directus

LABEL directus.version="${VERSION}"
LABEL org.opencontainers.image.source https://github.com/${REPOSITORY}

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

# Copy rootfs files
COPY ./rootfs /

# Install system dependencies
# - 'bash' for entrypoint script
# - 'ssmtp' to be able to send mails
RUN \
  apk upgrade --no-cache && \
  apk add --no-cache bash ssmtp util-linux && \
# Install global node dependencies
  npm install -g yargs pino pino-colada && \
# prepare for user space
  chown -R node:node /directus

# Switch to user 'node'
USER node
WORKDIR /directus

# Install Directus (retry if it fails for some reason) and runtime dependencies
RUN \
  for i in $(seq 10); do npm install "directus@${VERSION}" && break || sleep 30; done && \
  npm install && \
# Create directories
  mkdir -p extensions/displays && \
  mkdir -p extensions/interfaces && \
  mkdir -p extensions/layouts && \
  mkdir -p extensions/modules && \
  mkdir -p database && \
  mkdir -p uploads

VOLUME \
  /directus/database \
  /directus/extensions \
  /directus/uploads

EXPOSE 8055
SHELL ["/bin/bash", "-c"]
ENTRYPOINT ["entrypoint"]
