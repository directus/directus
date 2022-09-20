#!/bin/sh -

DIRECTUS_DIR="/directus/api"
#DIRECTUS_DIR="/tmp"

# Install https://github.com/utomic-media/directus-extension-field-actions
mkdir -p ${DIRECTUS_DIR}/extensions/displays/fields-action
wget -O ${DIRECTUS_DIR}/extensions/displays/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/display-index.js
mkdir -p ${DIRECTUS_DIR}/extensions/interfaces/fields-action
wget -O ${DIRECTUS_DIR}/extensions/interfaces/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/interface-index.js

# Install https://github.com/u12206050/directus-extension-global-search
mkdir -p ${DIRECTUS_DIR}/extensions/modules
wget -O /tmp/global-search.zip https://github.com/u12206050/directus-extension-global-search/releases/download/1.0.0/global-search.zip
unzip -d ${DIRECTUS_DIR}/extensions/modules/ /tmp/global-search.zip

# Install https://github.com/u12206050/directus-extension-api-viewer-module
mkdir -p ${DIRECTUS_DIR}/extensions/modules/api-viewer
wget -O ${DIRECTUS_DIR}/extensions/modules/api-viewer/index.js https://github.com/u12206050/directus-extension-api-viewer-module/releases/download/1.1.1/index.js

# Install https://github.com/dimitrov-adrian/directus-extension-masked-interface
mkdir -p ${DIRECTUS_DIR}/extensions/interfaces/fields-masked
wget -O ${DIRECTUS_DIR}/extensions/interfaces/fields-masked/index.js https://github.com/dimitrov-adrian/directus-extension-masked-interface/releases/download/v1.1.0/index.js

# Install https://github.com/br41nslug/directus-extension-randomized
#mkdir -p /tmp/directus-extension-randomized
#mkdir -p ${DIRECTUS_DIR}/extensions/hooks/directus-extension-randomized
#git clone git@github.com:br41nslug/directus-extension-randomized.git /tmp/directus-extension-randomized
#cd /tmp/directus-extension-randomized
#npm install
#npm run build
#mv dist ${DIRECTUS_DIR}/extensions/hooks/directus-extension-randomized

# Install https://github.com/wellenplan/directus-extension-duration-display
#pnpm install @wellenplan/directus-extension-duration-display
