ARG NODE_VERSION=latest
FROM node:${NODE_VERSION}

WORKDIR /directus
COPY . .
RUN npm install

WORKDIR /project

CMD ["npx", "ts-node", "/directus/api/src/start.ts"]
