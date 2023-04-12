# Running Tests

> Tests ensure that the platform functions as expected when the existing codebase is modified. For more details on
> writing of tests, please refer to the following links.

- [App unit tests](/contributing/tests/app-unit-tests)
- [API unit tests](/contributing/tests/api-unit-tests)
- [Blackbox tests](/contributing/tests/blackbox-tests)

## Running app unit tests

Run `pnpm --filter app test`.

## Running API unit tests

Run `pnpm --filter api test`.

## Running blackbox tests

Install [Docker](https://docs.docker.com/get-docker/) and ensure that the service is running.

Run the following from the project's root directory.

```bash
# Ensure that you are testing on the lastest codebase
pnpm build

# Clean up in case you ran the tests before
docker compose -f tests-blackbox/docker-compose.yml down -v
# Start the necessary containers
docker compose -f tests-blackbox/docker-compose.yml up -d --wait

# Run the tests
pnpm test:blackbox
```

### Testing a specific database

Provide a csv of database drivers in the `TEST_DB` environment variable to test specific databases:

```bash
TEST_DB=cockroachdb pnpm test:blackbox
```

### Using an existing Directus instance

The test suite will spin up a fresh copy of the Directus API from the current build. To use an already running copy of
Directus, set the `TEST_LOCAL` flag:

```bash
TEST_DB=cockroachdb TEST_LOCAL=true pnpm test:blackbox
```

This will use `localhost:8055` as the URL for every test. Note: make sure to connect your local Directus database
instance to the test database container found in docker-compose in this folder.
