# syntax=docker/dockerfile:1.4

ARG NODE_VERSION=22

####################################################################################################
## Build Packages

FROM node:${NODE_VERSION}-alpine AS builder

RUN apk --no-cache add python3 py3-setuptools build-base

WORKDIR /directus

COPY package.json .
RUN corepack enable && corepack prepare

# Deploy as 'node' user to match pnpm setups in production image
# (see https://github.com/directus/directus/issues/23822)
RUN chown node:node .
USER node

ENV NODE_OPTIONS=--max-old-space-size=8192

COPY pnpm-lock.yaml .
RUN pnpm fetch

COPY --chown=node:node . .
RUN <<EOF
	set -ex
	pnpm install --recursive --offline --frozen-lockfile
	npm_config_workspace_concurrency=2 pnpm run build
	pnpm --filter directus deploy --legacy --prod dist
	cd dist
	# Regenerate package.json file with essential fields only
	# (see https://github.com/directus/directus/issues/20338)
	node -e '
		const f = "package.json", {name, version, type, exports, bin} = require(`./${f}`), {packageManager} = require(`../${f}`);
		fs.writeFileSync(f, JSON.stringify({name, version, type, exports, bin, packageManager}, null, 2));
	'
	mkdir -p database extensions uploads
EOF

####################################################################################################
## Create Production Image

FROM node:${NODE_VERSION}-alpine AS runtime

# pm2 is installed as a dependency of a private package rather than with
# `npm install --global`, because npm honours `overrides` only for a project
# install. pm2 pins its own dependencies exactly, so without the overrides its
# bundled js-yaml (GHSA-5p4m-2wfm-xmqj, CVE-2026-59869) and ip-address
# (CVE-2026-69192) are stuck on releases with known advisories.
COPY <<-'JSON' /opt/pm2/package.json
	{
	  "name": "directus-pm2-runtime",
	  "private": true,
	  "dependencies": {
	    "pm2": "6"
	  },
	  "overrides": {
	    "js-yaml": "4.3.1",
	    "ip-address": "10.3.1"
	  }
	}
JSON

# Apply outstanding OS-level security patches (openssl, zlib, busybox, ...).
# Install pm2, then purge npm, npx, corepack, and the npm cache from the
# final image.
#
# `--omit=dev` keeps pm2's devDependencies out of the image, and the symlinks
# put the same four pm2 executables on the path a global install would have.
RUN apk --no-cache upgrade \
	&& npm --prefix /opt/pm2 install --omit=dev --no-audit --no-fund \
	&& ln -s /opt/pm2/node_modules/.bin/pm2* /usr/local/bin/ \
	&& rm -rf \
		/usr/local/lib/node_modules/npm \
		/usr/local/lib/node_modules/corepack \
		/usr/local/bin/npm \
		/usr/local/bin/npx \
		/usr/local/bin/corepack \
		/root/.npm

USER node

WORKDIR /directus

ENV \
	DB_CLIENT="sqlite3" \
	DB_FILENAME="/directus/database/database.sqlite" \
	NODE_ENV="production" \
	NPM_CONFIG_UPDATE_NOTIFIER="false"

COPY --from=builder --chown=node:node /directus/ecosystem.config.cjs .
COPY --from=builder --chown=node:node /directus/dist .

EXPOSE 8055

CMD : \
	&& node cli.js bootstrap \
	&& pm2-runtime start ecosystem.config.cjs \
	;
