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

cp -r ./directus-custom-extensions-release/hooks/collab-hook ${DIRECTUS_HOOKS}

cp -r ./directus-custom-extensions-release/hooks/marketplace-filters-hook ${DIRECTUS_HOOKS}
cp -r ./directus-custom-extensions-release/hooks/workflows-defaults-hook ${DIRECTUS_HOOKS}
cp -r ./directus-custom-extensions-release/interfaces/filter-ext ${DIRECTUS_INTERFACES}

cp -r ./directus-custom-extensions-release/endpoints/webhook-api-endpoint ${DIRECTUS_ENDPOINTS}

# Migrations
#cp -r ./directus-custom-extensions-release/migrations/*add-collaboration* ${DIRECTUS_EXTENSIONS}/migrations
