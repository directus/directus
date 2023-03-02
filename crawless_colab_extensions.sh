#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"

curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

cp -r ./directus-custom-extensions-release/collab-hook ${DIRECTUS_HOOKS}
cp -r ./directus-custom-extensions-release/filter-ext ${DIRECTUS_INTERFACES}
