# Tests

> Tests ensure that the platform continues to work as intended when the existing codebase is modified.

The current test strategy for Directus consists of `Blackbox Tests` testing the overall functionality of the platform as well as `Unit Tests` testing individual parts of the codebase.


## Running Unit Tests

Use the following command to perform unit tests in all packages:
```bash
pnpm --workspace-root test
```

Use one of the following commands to perform more specific actions with unit tests (mix and match as desired):

```bash
# Run tests for a specific package (for example only in the API / App package)
pnpm --filter api test
pnpm --filter app test

# Start tests in watch mode
pnpm --filter api test -- --watch

# Enable coverage report
pnpm --filter api test -- --coverage

# Run specific test files using a filter pattern
pnpm --filter api test -- app.test.ts
pnpm --filter api test -- utils
```

:::tip Relative Commands

If you are already in a directory of a specific package, you may omit the `--filter` flag in `pnpm` commands since the commands will be executed relative to the current directory.

```bash
# Run API tests, from within the "/api" directory
pnpm test
```

:::

## Running Blackbox Tests

Install [Docker](https://docs.docker.com/get-docker/) and ensure that the service is up and running.

Run the following commands to start the blackbox tests:

```bash
# Ensure that you are testing against the lastest state of the codebase
pnpm --workspace-root build

# Clean up in case you ran the tests before
pnpm --filter tests-blackbox exec docker compose down --volumes
# Start the containers required for the tests
pnpm --filter tests-blackbox exec docker compose up --detach --wait

# Run the tests
pnpm --workspace-root test:blackbox
```

Subsequent test runs can be issued with the following command, if only modifications to the blackbox tests themselves have been made:

```bash
pnpm --filter tests-blackbox test
```

### Testing Specific Database Vendors

Provide a CSV of database vendors via the `TEST_DB` environment variable to target only a specific subset:

```bash
# Example targeting multiple vendors
TEST_DB=cockroachdb,postgres pnpm --workspace-root test:blackbox

# Example targeting a single vendor
TEST_DB=sqlite3 pnpm --workspace-root test:blackbox
```

### Using an Existing Directus Instance

Normally, the test suite will spin up a fresh copy of the Directus API built from the current state of the codebase. To use
an already running instance of Directus instead, enable the `TEST_LOCAL` flag:

```bash
TEST_DB=cockroachdb TEST_LOCAL=true pnpm --workspace-root test:blackbox
```

Note: The tests expect the instance running at `localhost:8055`. Make sure to connect the instance to the test database
container found in the `tests-blackbox/docker-compose.yml` file.

## Writing Unit Tests
Unit Tests are written throughout the codebase in a vite native unit test framework called [Vitest](https://vitest.dev). 

### Example
```
/directus/api/src/utils/get-date-formatted.test.ts
```
```ts
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { getDateFormatted } from './get-date-formatted.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

function getUtcDateForString(date: string) {
	const now = new Date(date);

	// account for timezone difference depending on the machine where this test is ran
	const timezoneOffsetInMinutes = now.getTimezoneOffset();
	const timezoneOffsetInMilliseconds = timezoneOffsetInMinutes * 60 * 1000;
	const nowUTC = new Date(now.valueOf() + timezoneOffsetInMilliseconds);

	return nowUTC;
}

test.each([
	{ utc: '2023-01-01T01:23:45.678Z', expected: '20230101-12345' },
	{ utc: '2023-01-11T01:23:45.678Z', expected: '20230111-12345' },
	{ utc: '2023-11-01T01:23:45.678Z', expected: '20231101-12345' },
	{ utc: '2023-11-11T12:34:56.789Z', expected: '20231111-123456' },
	{ utc: '2023-06-01T01:23:45.678Z', expected: '20230601-12345' },
	{ utc: '2023-06-11T12:34:56.789Z', expected: '20230611-123456' },
])('should format $utc into "$expected"', ({ utc, expected }) => {
	const nowUTC = getUtcDateForString(utc);

	vi.setSystemTime(nowUTC);

	expect(getDateFormatted()).toBe(expected);
});
```

## Writing Blackbox Tests

### Example

```
/directus/tests/blackbox/routes/server/ping.test.ts
```

```ts
import { getUrl } from '@common/config';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';

describe('/server', () => {
	describe('GET /ping', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			const response = await request(getUrl(vendor))
				.get('/server/ping')
				.expect('Content-Type', /text\/html/)
				.expect(200);

			const gqlResponse = await requestGraphQL(getUrl(vendor), true, null, {
				query: {
					server_ping: true,
				},
			});

			// Assert
			expect(response.text).toBe('pong');
			expect(gqlResponse.body.data.server_ping).toBe('pong');
		});
	});
});
```