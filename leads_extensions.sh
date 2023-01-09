#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"

mkdir -p ${DIRECTUS_EXTENSIONS}/migrations

# Install crawless custom chat extensions
# Download from project: https://gitlab.com/crawless/directus-custom-extensions
rm -rf directus-custom-extensions-release*
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

#mkdir -p ${DIRECTUS_HOOKS}/hide-modules
#mkdir -p ${DIRECTUS_HOOKS}/area-hook

cp -r ./directus-custom-extensions-release/dashboard ${DIRECTUS_MODULES}
cp -r ./directus-custom-extensions-release/leads ${DIRECTUS_MODULES}
cp -r ./directus-custom-extensions-release/areas ${DIRECTUS_MODULES}
cp -r ./directus-custom-extensions-release/saved-searches ${DIRECTUS_MODULES}
cp -r ./directus-custom-extensions-release/saved-searches/migrations/* ${DIRECTUS_EXTENSIONS}/migrations
#cp -r ./directus-custom-extensions-release/hide-modules/* ${DIRECTUS_HOOKS}/hide-modules
#cp -r ./directus-custom-extensions-release/area-hook/* ${DIRECTUS_HOOKS}/area-hook
cp -r ./directus-custom-extensions-release/hide-modules ${DIRECTUS_HOOKS}/
cp -r ./directus-custom-extensions-release/area-hook ${DIRECTUS_HOOKS}/

ls -la ${DIRECTUS_MODULES}
ls -la ${DIRECTUS_HOOKS}
