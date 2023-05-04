#!/bin/sh -

DIRECTUS_DIR="/directus"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_DISPLAYS="${DIRECTUS_EXTENSIONS}/displays"

mkdir -p ${DIRECTUS_EXTENSIONS}/migrations

# Install crawless custom chat extensions
# Download from project: https://gitlab.com/crawless/directus-custom-extensions
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

ls -la ./directus-custom-extensions-release

cp -r ./directus-custom-extensions-release/interfaces/chat ${DIRECTUS_INTERFACES}
cp -r ./directus-custom-extensions-release/displays/chat-display ${DIRECTUS_DISPLAYS}

#cp ./directus-custom-extensions-release/migrations/*chat* ${DIRECTUS_EXTENSIONS}/migrations
