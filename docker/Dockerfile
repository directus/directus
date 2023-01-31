### Builder
ARG NODE_VERSION=18-alpine
FROM node:${NODE_VERSION} as builder

ARG LIBVIPS_VERSION

RUN apk --no-cache add \
  # Deps required to compile some Node.js packages
  python3 \
  build-base \
  # Use custom build of libvips (dev files required to build sharp)
  "vips-dev=~${LIBVIPS_VERSION}"
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /directus
COPY /dist .

RUN npm install --no-package-lock
RUN rm *.tgz

### Directus Image
FROM node:${NODE_VERSION}

ARG VERSION
ARG REPOSITORY=directus/directus
ARG LIBVIPS_VERSION

LABEL directus.version="${VERSION}"

# Default environment variables
# (see https://docs.directus.io/reference/environment-variables/)
ENV \
  DB_CLIENT="sqlite3" \
  DB_FILENAME="/directus/database/database.sqlite" \
  EXTENSIONS_PATH="/directus/extensions" \
  STORAGE_LOCAL_ROOT="/directus/uploads"

# Upgrade system and install additionals packages
RUN apk upgrade --no-cache && apk add --no-cache \
  # To be able to send mails
  ssmtp \
  # Support for specifying the timezone (via "TZ" env variable)
  tzdata \
  # Custom libvips (C++ bindings for sharp)
  # with heif and magick (PPM, FITS, JP2K) support
  "vips-cpp=~${LIBVIPS_VERSION}" \
  "vips-magick=~${LIBVIPS_VERSION}" \
  "vips-heif=~${LIBVIPS_VERSION}" \
  # Create directory for Directus with corresponding ownership
  # (can be omitted on newer Docker versions since WORKDIR below will do the same)
  && mkdir /directus && chown node:node /directus

# Switch to user 'node' and directory '/directus'
USER node
WORKDIR /directus

# Disable npm update warnings
RUN echo "update-notifier=false" >> ~/.npmrc

COPY --from=builder --chown=node:node /directus .

# Create data directories
RUN mkdir -p \
  database \
  extensions \
  uploads

# Expose data directories as volumes
VOLUME \
  /directus/database \
  /directus/extensions \
  /directus/uploads

EXPOSE 8055
CMD npx directus bootstrap && npx directus start
