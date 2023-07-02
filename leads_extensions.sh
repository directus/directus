#!/bin/sh -

DIRECTUS_DIR="/directus"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"

mkdir -p ${DIRECTUS_EXTENSIONS}/migrations

# Install crawless custom chat extensions
# Download from project: https://gitlab.com/crawless/directus-custom-extensions
rm -rf directus-custom-extensions-release*
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

mkdir -p ${DIRECTUS_HOOKS}/hide-modules

ls -la ./directus-custom-extensions-release

# cp is sometimes aliased to cp -i, which will prompt before overwriting
# The leading backslash will skip the alias and use the default cp
\cp -r ./directus-custom-extensions-release/modules/dashboard ${DIRECTUS_MODULES}/
\cp -r ./directus-custom-extensions-release/modules/leads ${DIRECTUS_MODULES}/
\cp -r ./directus-custom-extensions-release/modules/areas ${DIRECTUS_MODULES}/
\cp -r ./directus-custom-extensions-release/modules/saved-searches ${DIRECTUS_MODULES}/

\cp -r ./directus-custom-extensions-release/hooks/area-hook ${DIRECTUS_HOOKS}/
\cp -r ./directus-custom-extensions-release/hooks/hide-modules ${DIRECTUS_HOOKS}/

\cp -r ./directus-custom-extensions-release/migrations/*saved-searches* ${DIRECTUS_EXTENSIONS}/migrations

echo "Contents of ${DIRECTUS_MODULES}:"
ls -la ${DIRECTUS_MODULES}
echo "Contents of ${DIRECTUS_HOOKS}:"
ls -la ${DIRECTUS_HOOKS}
