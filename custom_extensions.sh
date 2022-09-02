#!/bin/sh -

DIRECTUS_DIR="/directus/api"
#DIRECTUS_DIR="/tmp"

# Install https://github.com/utomic-media/directus-extension-field-actions

mkdir -p ${DIRECTUS_DIR}/displays/fields-action
wget -O ${DIRECTUS_DIR}/displays/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/display-index.js

mkdir -p ${DIRECTUS_DIR}/interfaces/fields-action
wget -O ${DIRECTUS_DIR}/interfaces/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/interface-index.js

# Install https://github.com/u12206050/directus-extension-global-search

#git clone https://github.com/u12206050/directus-extension-global-search /tmp/global-search
#cd /tmp/global-search
#npm install
#npm run build
#mkdir -p ${DIRECTUS_DIR}/extensions/modules/global-search
#cp /tmp/global-search/dist/index.js ${DIRECTUS_DIR}/extensions/modules/global-search/index.js
