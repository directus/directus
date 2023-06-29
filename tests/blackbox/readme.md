# Blackbox tests

## Setup

Make sure the containers for the databases are running by running `docker compose up` in this folder.

Directus needs to be deployed with `pnpm --filter directus deploy --prod dist`. When using the `test:blackbox` script in
the workspace root (`pnpm -w run test:blackbox`) this is already done.

## Running tests locally

Run `pnpm -w run test:blackbox` to run the blackbox tests for every supported database vendor.

Prepend `TEST_SAVE_LOGS=trace` to get trace logs at `server-logs-*` in this folder.

### Testing a specific database

Provide a csv of database drivers in the `TEST_DB` environment variable to test specific databases:

```
TEST_DB=cockroachdb pnpm -w run test:blackbox
```

### Using an existing Directus instance

The test suite will spin up a fresh copy of the Directus API from the current build. To use an already running copy of
Directus, set the `TEST_LOCAL` flag:

```
TEST_DB=cockroachdb TEST_LOCAL=true pnpm -w run test:blackbox
```

This will use `127.0.0.1:8055` as the URL for every test. Note: make sure to connect your local Directus database
instance to the test database container found in docker-compose in this folder.
