# Directus JS SDK

> This is a BETA release, expect that things do not work!

The design goals for this rebuild:
- TypeScript first
- Modular/Composable architecture
- Lightweight and Dependency Free

## Composable Client

The client is split up in separate features you can mix and match to compose a client with only the features you need or want.

```ts
const client = useDirectus<Schema>('https://api.directus.io');
```

This client is currently an empty wrapper without any functionality.Before you can do anything with it you'll need to add some features.
The following composables are available/in progress:
- `rest()` REST request functions
  - adds `.request(...)` on the client
- `graphql()` GraphQL request functions
  - adds `.query(...)` on the client
- `authenticate()` authentication functions
  - adds `.login({ email, password })`, `.logout()`, `.refresh()` on the client
- `realtime()` websocket connectivity
  - adds `.subscribe(...)`, `.message(...)`, `.receive((message) => {})` on the client
- `subscription()` GraphQL Subscriptions [not available]
  - will add `.subscription()`

For this example we'll build a client including `rest` and `graphql`:
```ts
const client = useDirectus<Schema>('https://api.directus.io')
    .use(rest())
    .use(graphql());

// do a REST request
const restResult = await client.request(readItems('articles'));

// do a GraphQL request
const gqlResult = await client.query<OutputType>(`
    query {
        articles {
            id
            title
            author {
                first_name
            }
        }
    }
`);

```

## Authentication

```ts
const client = useDirectus<Schema>('https://api.directus.io')
    .use(rest())
    .use(authentication('json'));

await client.login('admin@example.com', 'd1r3ctu5');

// do authenticated requests
```

## Real-Time

The `realtime()` extension allows you to work with a Directus REST WebSocket.

Subscribing to updates:
```ts
const client = useDirectus<Schema>('https://api.directus.io')
    .use(realtime({
		    authMode: 'public',
    }));

const { subscription, unsubscribe } = await client.subscribe('test', {
	  query: { fields: ['*'] },
});

for await (const item of subscription) {
	  console.log('subscription', { item });
}

// unsubscribe()
```

Receive/Send messages:
```ts
const client = useDirectus<Schema>('https://api.directus.io')
    .use(realtime({
		    authMode: 'public',
    }));

const stop = client.receive((message) => {
    if ('type' in message && message['type'] === 'pong') {
        console.log('PONG received');
        stop();
    }
});

client.message({ type: 'ping' });
```