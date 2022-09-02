#!/bin/bash

DIRECTUS_DIR="/directus/api"
#DIRECTUS_DIR="/tmp"

# Install https://github.com/utomic-media/directus-extension-field-actions

mkdir -p ${DIRECTUS_DIR}/displays/fields-action
pushd ${DIRECTUS_DIR}/displays/fields-action
	wget -O index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/display-index.js
popd

mkdir -p ${DIRECTUS_DIR}/interfaces/fields-action
pushd ${DIRECTUS_DIR}/interfaces/fields-action
	wget -O index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.1.1/interface-index.js
popd

