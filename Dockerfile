# NOTE: Testing Only. DO NOT use this in production

ARG NODE_VERSION=15-alpine

FROM node:${NODE_VERSION}

WORKDIR /directus

COPY package*.json ./
COPY api/package.json api/
COPY api/cli.js api/
COPY app/package.json app/
COPY docs/package.json docs/
COPY packages/create-directus-project/package.json packages/create-directus-project/
COPY packages/create-directus-project/lib/index.js packages/create-directus-project/lib/
COPY packages/drive/package.json packages/drive/
COPY packages/drive-azure/package.json packages/drive-azure/
COPY packages/drive-gcs/package.json packages/drive-gcs/
COPY packages/drive-s3/package.json packages/drive-s3/
COPY packages/format-title/package.json packages/format-title/
COPY packages/gatsby-source-directus/package.json packages/gatsby-source-directus/
COPY packages/schema/package.json packages/schema/
COPY packages/sdk/package.json packages/sdk/
COPY packages/specs/package.json packages/specs/

RUN npm ci

COPY . .

# Required for Node < 15 (no native workspaces)
RUN npx lerna link

WORKDIR /directus/api

ADD ./e2e-tests/start.sh ./

RUN chmod +x ./start.sh

CMD ["./start.sh"]

EXPOSE 8055/tcp
