# Tests

> Tests ensure that the platform functions as expected when the existing codebase is modified.

## Running Tests

### Running App Unit Tests

Run `pnpm --filter app test`.

### Running API Unit Tests

Run `pnpm --filter api test`.

### Running Blackbox Tests

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

#### Testing a Specific Database

Provide a csv of database drivers in the `TEST_DB` environment variable to test specific databases:

```bash
TEST_DB=cockroachdb pnpm test:blackbox
```

#### Using an Existing Directus Instance

Normally, the test suite will spin up a fresh copy of the Directus API built from the current repository state. To use
an already running copy of Directus instead, set the `TEST_LOCAL` flag:

```bash
TEST_DB=cockroachdb TEST_LOCAL=true pnpm test:blackbox
```

Note: The tests expect the instance running at `localhost:8055`. Make sure to connect the instance to the test database
container found in the `tests-blackbox/docker-compose.yml` file.

## Working on Tests

<Card
  title="Blackbox Tests"
  h="2"
  text="Learn how to write and add new blackbox tests."
  url="/contributing/tests/blackbox-tests" />
