# `@directus/memory`

Directus has various different needs for ephemeral storage that's synced between multiple processes for the same
Directus Projects. To streamline that setup, this package exports three classes that are used for everything related to
ephemeral storage:

- [Cache](#cache)
- [Bus](#bus)
- [Limiter](#limiter)

## Kv

The Kv class is a simple key-value store

### Basic Usage

```ts
import { createKv } from '@directus/memory';

const cache = createKv({
	type: 'memory',
});

await cache.set('my-key', 'my-value');
```

## Cache

The cache class is a Kv class extended with an LRU store

### Basic Usage

```ts
import { createCache } from '@directus/memory';

const cache = createCache({
	type: 'memory',
	maxKeys: 500,
});

await cache.set('my-key', 'my-value');
```

## Bus

The bus class is a pub-sub abstraction. The memory type bus just handles local handlers, which adds no benefit next to
having a shared API for using pubsub.

### Basic Usage

```ts
import { Redis } from 'ioredis';
import { createBus } from '@directus/memory';

const bus = createBus({
	type: 'redis',
	redis: new Redis(),
	namespace: 'directus',
});
```

## Limiter

The limiter class is a basic shared rate limiter.

### Basic Usage

```ts
import { createLimiter } from '@directus/memory';

const limiter = createLimiter({
	type: 'memory',
	points: 10,
	duration: 5,
});
```
