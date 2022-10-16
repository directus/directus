# Intro

Instructions to customize [Directus](https://directus.io) to our needs

## Prepare the env

Follow the default
[instructions](https://docs.directus.io/contributing/running-locally.html#_4-install-the-dependencies-and-build-the-project)

```
npm install -g pnpm
pnpm install
pnpm -r build
```

If you get the vite buid / node error "Reached heap limit Allocation failed", check memory, default 2GB:

```
node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
```

increase mem to 4GB or more:

```
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm -r build
```

## Bootstrap

Create .env in ./api:

```
PUBLIC_URL="localhost"
HOST="0.0.0.0"
PORT=8055
KEY="AAA-BBB-CCC"
SECRET="123-456-789"
TELEMETRY=false
DB_CLIENT="sqlite3"
DB_FILENAME="../local/test.db"
EXTENSIONS_PATH="../local/extensions"
STORAGE_LOCAL_ROOT="../local/uploads"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="changeme"
```

pnpm --dir api cli bootstrap

## Start

Start API in one terminal:

```
pnpm --filter directus dev
```

Start APP in another terminal:

```
pnpm --filter @directus/app dev
```

## Custom CSS

_:not(svg _) { user-select: unset }

.title { user-select: text }

.display-labels { user-select: text }
