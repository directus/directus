#!/bin/sh -

DIRECTUS_DIR="/directus"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"

mkdir -p ${DIRECTUS_EXTENSIONS}/migrations

curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

cp -r ./directus-custom-extensions-release/collab-hook ${DIRECTUS_HOOKS}
cp -r ./directus-custom-extensions-release/collab-hook/migrations/* ${DIRECTUS_EXTENSIONS}/migrations

cp -r ./directus-custom-extensions-release/marketplace-filters-hook ${DIRECTUS_HOOKS}
cp -r ./directus-custom-extensions-release/workflows-defaults-hook ${DIRECTUS_HOOKS}
cp -r ./directus-custom-extensions-release/filter-ext ${DIRECTUS_INTERFACES}

cp -r ./directus-custom-extensions-release/webhook-api-endpoint ${DIRECTUS_ENDPOINTS}
