# E2E tests

## Setup

Make sure the containers for the databases are running by running `docker compose up -d` in this folder.

## Running tests locally

Run `npm run test:e2e` to run the e2e tests for every supported database vendor.

### Testing a specific database

Provide a csv of database drivers in the `TEST_DB` environment variable to test specific databases:

```
TEST_DB=cockroachdb npm run test:e2e
```

### Using an existing Directus instance

The test suite will spin up a fresh copy of the Directus API from the current build. To use an already running copy of
Directus, set the `TEST_LOCAL` flag:

```
TEST_DB=cockroachdb TEST_LOCAL=true npm run test:e2e
```

This will use `localhost:8055` as the URL for every test. Note: make sure to connect your local Directus database
instance to the test database container found in docker-compose in this folder.

### Watching for (test) changes

Use `npm run test:e2e:watch` to enable Jest's `--watch` mode, especially useful in combination with the flags above.

This _does not_ watch changes to Directus; it only watches changes to the tests.
