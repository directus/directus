#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_SNAPSHOTS="${DIRECTUS_EXTENSIONS}/snapshots"

# Create if not exists
mkdir -p ${DIRECTUS_SNAPSHOTS}

# TODO, fix this download, how to download from a different project Packages Registry??
#curl --header 'Private-Token: ${CI_JOB_TOKEN}' \
#	https://gitlab.com/api/v4/projects/39544563/packages/generic/Releases/0.0.1/directus-payment-integration-release.zip

wget https://s3.eu-central-2.wasabisys.com/crwtests/directus-payment-integration-release.zip

ls -la

unzip directus-payment-integration-release.zip

mv ./directus-payment-integration-release/payments-api ${DIRECTUS_ENDPOINTS}
mv ./directus-payment-integration-release/payments-hook ${DIRECTUS_HOOKS}
mv ./directus-payment-integration-release/collection-ext ${DIRECTUS_INTERFACES}
mv ./directus-payment-integration-release/filter-ext ${DIRECTUS_INTERFACES}
mv ./directus-payment-integration-release/payments-module ${DIRECTUS_MODULES}
mv ./directus-payment-integration-release/snapshots/* ${DIRECTUS_SNAPSHOTS}
