# Directus e2e testing suite

These E2E tests are to test the whole of Directus at once. Ensuring that all components (e.g. API, UI, DB and other
services providers) work together as expected.

## Getting started

To locally run tests, make sure to have the following installed:

- Node.js (v22)
- Docker (make sure it's running)

Next, make sure to run `pnpm install` and `pnpm run build` to ensure that you're testing against the latest code.

Now you can start up the test suite by running:

- `pnpm test` or `pnpm vitest --project sqlite` to start up the tests against directus running with a sqlite database

- `pnpm test:dev my-test` or `DEV=true pnpm vitest --project sqlite my-test` to start all tests matching the name
  `my-test` in dev mode, which hot reloads the api and keeps the docker containers running.

## Running tests indepth

This test suite fully makes use of the [vitest cli](https://vitest.dev/guide/cli.html), so all options that vitest
provides can be used.

### Projects

The `--project` flag specifies against which databases the tests should be run and at least one project must be
specified. You can specify multiple databases using `vitest --project sqlite --project postgres`. The follwing databases
are available: `sqlite, postgres, mysql, maria, mssql, cockroachdb and oracle`

Additionally, are all these databases with a `-sb` suffix available (e.g. `sqlite-sb`), which run tests that spin up
their own sandbox instance instead of relying on a shared one. Tests matching `*-sb.test.ts` are scoped to only run on
these `-sb` projects as they require more resources and have a longer runtime.

## Writing tests

For general best practices on writing tests, please have a quick look at
[this guide](https://github.com/goldbergyoni/javascript-testing-best-practices?tab=readme-ov-file#section-0%EF%B8%8F%E2%83%A3-the-golden-rule).

Adding a test is as simple as creating a new file ending on `.test.ts` and writing your test using vitest. A minial test
looks like this:

```ts
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

test('Pinging the API', async () => {
	const response = await fetch(`http://localhost:${port}/server/ping`);
	const data = await response.text();

	expect(response.status).toBe(200);
	expect(data).toEqual('pong');
});
```

### Tests requiring a custom schema

To make it simpler to write tests that require custom tables, the test suite provides a `useSnapshot` function. This
function loads the `snaphot.json` file located in the same folder the test is located and applies the schema to the
database when called. The function ensures uniqueness of collection names by replacing all `_1234` suffixes with a
unique prefix. To improve type savety, an additional Schema can be provided. All collection names can be then accessed
through the `collections` property of the returned snapshot.

```ts
const { collections } = await useSnapshot<Schema>(api);
```

A custom schema can be generated using the sandbox cli: `sandbox -x postgres` in the folder of your tests. This will
create the `schema.d.ts` and `snapshot.json` into the current folder. Make sure all collection names end with `_1234` to
ensure uniqueness. To modify an existing schema of a test, use `sandbox -s -x postgres` to start up a sandbox with the
schema preloaded.

### Interacting with the API

It is recommended to use the Directus SDK in most cases to use and test functionality of the API, alternatively make use
of `fetch` for more low level testing.

```ts
import { createDirectus, rest, serverPing, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { expect, test } from 'vitest';

test('Pinging the API', async () => {
	const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

	const response = await api.request(serverPing());

	expect(response).toEqual('pong');
});
```

### Testing against a custom Directus instance

In order to test Directus against custom configurations like different env vars, a test can spin up their own Directus
instance. This comes with a significant performance overhead to spin up the containers and bootstraping. Because of
this, all tests that spin up their own instance should be named with the `*.sb.test.ts` pattern. These tests can be run
by specifying the `-sb` projects (e.g. `vitest --project sqlite-sb`), which ensures that they don't run by default and
only when explicitly specified.

A minimal tests that spins up their own instance looks like this:

```ts
import { sandbox } from '@directus/sandbox';
import { createDirectus, rest, serverPing, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { expect, test } from 'vitest';

test('Pinging the API', async () => {
	const directus = await sandbox(database, {
		inspect: false,
		prefix: 'ping-test',
		env: {
			CUSTOM_ENV: 'test',
		},
		docker: {
			suffix: getUID(),
		},
	});

	const api = createDirectus(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	const response = await api.request(serverPing());

	expect(response).toEqual('pong');

	await directus.stop();
});
```

For more details on how to use the sandbox, please refer to the [sandbox readme](../sandbox/readme.md).

### Other utils

- `getUID()` returns a unique string scoped to the current test file. Can help in reducing conflicts.
- `@utils/constants.js` exposes the `database`, `port`, `env`, and `options` of the current global api instance.
