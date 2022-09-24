#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
#DIRECTUS_DIR="/tmp"

# Install https://github.com/utomic-media/directus-extension-field-actions
mkdir -p ${DIRECTUS_EXTENSIONS}/displays/fields-action
wget -O ${DIRECTUS_EXTENSIONS}/displays/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/display-index.js
mkdir -p ${DIRECTUS_INTERFACES}/fields-action
wget -O ${DIRECTUS_INTERFACES}/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/interface-index.js

# Install https://github.com/u12206050/directus-extension-global-search
mkdir -p ${DIRECTUS_MODULES}
wget -O /tmp/global-search.zip https://github.com/u12206050/directus-extension-global-search/releases/download/1.0.0/global-search.zip
unzip -d ${DIRECTUS_MODULES}/ /tmp/global-search.zip

# Install https://github.com/u12206050/directus-extension-api-viewer-module
mkdir -p ${DIRECTUS_MODULES}/api-viewer
wget -O ${DIRECTUS_MODULES}/api-viewer/index.js https://github.com/u12206050/directus-extension-api-viewer-module/releases/download/1.1.1/index.js

# Install https://github.com/dimitrov-adrian/directus-extension-masked-interface
mkdir -p ${DIRECTUS_INTERFACES}/fields-masked
wget -O ${DIRECTUS_INTERFACES}/fields-masked/index.js https://github.com/dimitrov-adrian/directus-extension-masked-interface/releases/download/v1.1.0/index.js

curl --header 'Private-Token: ${CI_JOB_TOKEN}' \
	https://gitlab.com/api/v4/projects/39544563/packages/generic/Releases/0.0.1/directus-payment-integration-release.zip

ls -la

unzip directus-payment-integration-release.zip

mv ./directus-payment-integration-release/payments-api ${DIRECTUS_ENDPOINTS}
mv ./directus-payment-integration-release/payments-hook ${DIRECTUS_HOOKS}
mv ./directus-payment-integration-release/collection-ext ${DIRECTUS_INTERFACES}
mv ./directus-payment-integration-release/filter-ext ${DIRECTUS_INTERFACES}
mv ./directus-payment-integration-release/payments-module ${DIRECTUS_MODULES}

# Install https://github.com/br41nslug/directus-extension-randomized
#mkdir -p /tmp/directus-extension-randomized
#mkdir -p ${DIRECTUS_EXTENSIONS}/hooks/directus-extension-randomized
#git clone git@github.com:br41nslug/directus-extension-randomized.git /tmp/directus-extension-randomized
#cd /tmp/directus-extension-randomized
#npm install
#npm run build
#mv dist ${DIRECTUS_EXTENSIONS}/hooks/directus-extension-randomized

# Install https://github.com/wellenplan/directus-extension-duration-display
#pnpm install @wellenplan/directus-extension-duration-display
