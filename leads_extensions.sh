#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"

#mkdir -p ${DIRECTUS_EXTENSIONS}/migrations

# Install crawless custom chat extensions
# Download from project: https://gitlab.com/crawless/directus-custom-extensions
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

cp -r ./directus-custom-extensions-release/dashboard ${DIRECTUS_MODULES}
cp -r ./directus-custom-extensions-release/leads ${DIRECTUS_MODULES}

ln -s ${DIRECTUS_MODULES}
