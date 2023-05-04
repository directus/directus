#!/bin/sh -

DIRECTUS_DIR="/directus"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"

# TODO@geo This is a hack to download the archived files from another project
# Download from project: https://gitlab.com/crawless/directus-payment-integration
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/39544563/packages/generic/Releases/0.0.1/directus-payment-integration-release.zip

unzip directus-payment-integration-release.zip

ls -la ./directus-payment-integration-release

mkdir -p ${DIRECTUS_ENDPOINTS}/payments-api
mv -v ./directus-payment-integration-release/payments-api/* ${DIRECTUS_ENDPOINTS}/payments-api

mkdir -p ${DIRECTUS_HOOKS}/payments-hook
mv -v ./directus-payment-integration-release/payments-hook/* ${DIRECTUS_HOOKS}/payments-hook/

mv -v ./directus-payment-integration-release/payments-module ${DIRECTUS_MODULES}
#mv -v ./directus-payment-integration-release/migrations ${DIRECTUS_EXTENSIONS}

rm -rf directus-custom-extensions-release*
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

cp -r ./directus-custom-extensions-release/services-module ${DIRECTUS_MODULES}
cp -r ./directus-custom-extensions-release/orders-module ${DIRECTUS_MODULES}
