# Blackbox tests

## Running tests

Run `pnpm test` to locally test against postgres

Run `pnpm test:all` to locally test against all databases

Run `pnpm vitest --project sqlite` to test against a specific database. The project option can be used multiple times to test against multiple different databases at the same time.

## Writing tests

The basic test structure goes as follows.

1. Create a new folder for your tests
2. Create your test file, ending with `.test.ts`
3. If relying on a schema, please use the `useSnapshot` utility function.
   
```ts
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));
```

1. For interaction and testing, it's recomended to use the Directus SDK.
   
```ts
const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
```

5. While writing tests, make sure that reruning a test doesn't cause conflicts. E.g. using `randomUUID()` to avoid user or permission collisions.


> The blackbox tests rely on the `@directus/sandbox` package for starting up the api so have a look there for more configuration options.

### Creating a custom schema

If a custom schema is required for your tests, make sure that each collection ends with `_1234`, that way a unique collection name can be guaranteed.

A custom schema can be created by running the sandbox cli: `sandbox -x postgres` in the folder of your tests. This automatically writes the `schema.d.ts` and `snapshot.json` into the current folder. If you quickly want to modify an existing schema, use `sandbox -s -x postgres` to start up a sandbox with the schema preloaded.
