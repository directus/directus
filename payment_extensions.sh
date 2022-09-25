#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_SNAPSHOTS="${DIRECTUS_DIR}/snapshots"

# Create if not exists
mkdir -p ${DIRECTUS_SNAPSHOTS}

# TODO@geo This is a hack to download the archived files from another project
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/39544563/packages/generic/Releases/0.0.1/directus-payment-integration-release.zip

unzip directus-payment-integration-release.zip

mkdir -p ${DIRECTUS_HOOKS}/payments-hook

mv -v ./directus-payment-integration-release/payments-api ${DIRECTUS_ENDPOINTS}
mv -v ./directus-payment-integration-release/payments-hook/* ${DIRECTUS_HOOKS}/payments-hook/
mv -v ./directus-payment-integration-release/collection-ext ${DIRECTUS_INTERFACES}
mv -v ./directus-payment-integration-release/filter-ext ${DIRECTUS_INTERFACES}
mv -v ./directus-payment-integration-release/payments-module ${DIRECTUS_MODULES}
mv -v ./directus-payment-integration-release/snapshots/* ${DIRECTUS_SNAPSHOTS}
mv -v ./directus-payment-integration-release/migrations ${DIRECTUS_EXTENSIONS}
