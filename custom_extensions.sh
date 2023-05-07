#!/bin/sh -

DIRECTUS_DIR="/directus"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_INTERFACES="${DIRECTUS_EXTENSIONS}/interfaces"
DIRECTUS_MODULES="${DIRECTUS_EXTENSIONS}/modules"
DIRECTUS_DISPLAYS="${DIRECTUS_EXTENSIONS}/displays"
DIRECTUS_ENDPOINTS="${DIRECTUS_EXTENSIONS}/endpoints"
DIRECTUS_HOOKS="${DIRECTUS_EXTENSIONS}/hooks"

#DIRECTUS_DIR="/tmp"

mkdir -p ${DIRECTUS_EXTENSIONS}/migrations

# Install https://github.com/utomic-media/directus-extension-field-actions
mkdir -p ${DIRECTUS_DISPLAYS}/fields-action
wget -O ${DIRECTUS_DISPLAYS}/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.2.0/display-index.js
mkdir -p ${DIRECTUS_INTERFACES}/fields-action
wget -O ${DIRECTUS_INTERFACES}/fields-action/index.js https://github.com/utomic-media/directus-extension-field-actions/releases/download/1.2.0/interface-index.js

# Install https://github.com/u12206050/directus-extension-global-search
mkdir -p ${DIRECTUS_MODULES}
#wget -O /tmp/global-search.zip https://github.com/u12206050/directus-extension-global-search/releases/download/1.0.0/global-search.zip
#unzip -d ${DIRECTUS_MODULES}/ /tmp/global-search.zip

# Install https://github.com/u12206050/directus-extension-api-viewer-module
mkdir -p ${DIRECTUS_MODULES}/api-viewer
wget -O ${DIRECTUS_MODULES}/api-viewer/index.js https://github.com/u12206050/directus-extension-api-viewer-module/releases/download/1.1.1/index.js

# Install https://github.com/dimitrov-adrian/directus-extension-masked-interface
mkdir -p ${DIRECTUS_INTERFACES}/fields-masked
wget -O ${DIRECTUS_INTERFACES}/fields-masked/index.js https://github.com/dimitrov-adrian/directus-extension-masked-interface/releases/download/v1.1.0/index.js

# Install crawless custom extensions
# Download from project: https://gitlab.com/crawless/directus-custom-extensions
rm -rf directus-custom-extensions-release*
curl --header "Private-Token: ${GITLAB_PIPELINE_TOKEN}" -LO ${CI_API_V4_URL}/projects/40500377/packages/generic/Releases/0.0.1/directus-custom-extensions-release.zip

unzip directus-custom-extensions-release.zip

cd directus-custom-extensions-release
ls -la

# Extensions to skip (these belong to different control scripts)
# These are payment, chat, leads and collaboration extensions
skip_extensions="payments-api payments-hook payments-module services-module orders-module chat chat-display dashboard leads areas saved-searches area-hook hide-modules collab-hook marketplace-filters workflows-defaults extended-api"

# Corresponding migrations to skip
skip_migrations="add-chat add-saved-searches add-collaboration"

for ext_type in *
do
    # Skip all migrations here
    if [ "$ext_type" = "migrations" ]; then
        continue
    fi

    cd ${ext_type}
    for ext_name in *
    do
        # Skip extensions
        if [[ "$skip_migrations" =~ $ext_name ]]; then
        	echo "Adding ${ext_type}/${ext_name}"
        	cp -r "${ext_name}" ${DIRECTUS_EXTENSIONS}/${ext_type}/
        else
        	echo "Skipping ${ext_type}/${ext_name}"
        fi
#        if echo "$skip_extensions" | grep -qw "$ext_name"; then
#            echo "Skipping ${ext_type}/${ext_name}"
#            continue
#        fi
#        echo "Adding ${ext_type}/${ext_name}"
#        cp -r ${ext_name} ${DIRECTUS_EXTENSIONS}/${ext_type}/

    done
    cd ..

done

if [ ! -d "migrations" ]; then
    echo "No migrations found"
    exit 0
fi
cd migrations
for migration in *
do
    # Skip migrations
    if echo "$skip_migrations" | grep -qw "$migration"; then
    	  echo "Skip migration ${migration}"
        continue
    fi
    echo "Adding migration ${migration}"
    cp ${migration} ${DIRECTUS_EXTENSIONS}/migrations/
done

cd ..
