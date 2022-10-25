#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_MIGRATIONS="${DIRECTUS_EXTENSIONS}/migrations"

mv "${DIRECTUS_MIGRATIONS}" "${DIRECTUS_EXTENSIONS}/tmp_migrations"

node ./cli.js bootstrap && for snapshots_file in ./snapshots/*.yaml; do echo $snapshots_file; node ./cli.js schema apply --yes $snapshots_file || true; done && node ./dist/start.js;
