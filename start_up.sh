#!/bin/sh -

DIRECTUS_DIR="/directus/api"
DIRECTUS_EXTENSIONS="${DIRECTUS_DIR}/extensions"
DIRECTUS_MIGRATIONS="${DIRECTUS_EXTENSIONS}/migrations"
DIRECTUS_MIGRATIONS_TMP="${DIRECTUS_EXTENSIONS}/tmp_migrations"

mv "${DIRECTUS_MIGRATIONS}" "${DIRECTUS_MIGRATIONS_TMP}"

echo "Start up script..."
node ./cli.js bootstrap && for snapshots_file in ./snapshots/*.yaml; do echo $snapshots_file; node ./cli.js schema apply --yes $snapshots_file || true; done && mv "${DIRECTUS_MIGRATIONS_TMP}" "${DIRECTUS_MIGRATIONS}" && node ./cli.js database migrate:latest && node ./dist/start.js;
