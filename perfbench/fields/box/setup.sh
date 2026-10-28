#!/bin/bash
# Builds main and main + field lookups on box. Runs under ~/perfbench-fm.
set -euo pipefail
B=~/perfbench-fm; cd $B
export PATH="$HOME/.local/share/mise/shims:$PATH"
eval "$(mise activate bash)"; mise shell node@24 >/dev/null 2>&1 || true
[ -d repo ] || git clone -q https://github.com/directus/directus.git repo
cd repo
git fetch -q origin main && git checkout -q -B bench-main origin/main
# FM_REF: the field lookups PR branch on origin. Falls back to a local git bundle if set to "bundle".
if [ "${FM_REF:-bundle}" = bundle ]; then git fetch -q $B/fm.bundle bry/fields-store-maps:fm-src; else git fetch -q origin "$FM_REF:fm-src"; fi
echo "main: $(git rev-parse --short HEAD)"
mise exec node@24 -- pnpm install --frozen-lockfile --ignore-scripts > $B/install.log 2>&1
mise exec node@24 -- pnpm rebuild isolated-vm sqlite3 argon2 sharp >> $B/install.log 2>&1 || true
mise exec node@24 -- pnpm --filter "@directus/api..." --filter "@directus/app^..." build > $B/build-pkgs.log 2>&1
mise exec node@24 -- pnpm --filter @directus/app build > $B/build-app-main.log 2>&1
rm -rf $B/dists && mkdir -p $B/dists && cp -R app/dist $B/dists/baseline
git checkout -q -B bench-fm origin/main && git cherry-pick -X theirs $(git merge-base fm-src origin/main)..fm-src > /dev/null
echo "fieldsmap: $(git rev-parse --short HEAD)"
mise exec node@24 -- pnpm --filter @directus/app build > $B/build-app-fm.log 2>&1
cp -R app/dist $B/dists/fieldsmap
git checkout -q bench-main
for db in bench-big bench-stock; do
  cp $B/$db.db $B/$db.run.db
  (cd api && CONFIG_PATH=$B/api.env DB_FILENAME=$B/$db.run.db mise exec node@24 -- node dist/cli/run.js database migrate:latest) >> $B/migrate.log 2>&1
done
cd $B && npm i -s playwright-core@1.56 > /dev/null 2>&1 && npx -y playwright-core@1.56 install chromium > $B/pw.log 2>&1
echo setup-done
