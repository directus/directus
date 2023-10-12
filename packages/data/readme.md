# `@directus/data`

> **Warning** This is a work in progress. Nothing is expected to work yet.

## Installation

```
npm install @directus/data
```

The installation of a driver is also required.

## Usage

### Setup

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

// Instantiate the engine
const engine = new DataEngine();

// Instantiate a driver
const pgDriver = new DataDriverPostgres({
	connectionString: 'postgresql://root:password@localhost/mydb',
});

// register the driver to the engine
await engine.registerStore('postgres', pgDriver);
```

### Query data

```js
// query data
await engine.query({
	store: 'postgres',
	collection: 'articles',
	fields: [
		{
			type: 'primitive',
			field: 'id',
		},
	],
});
```

The above is resulting in the following flow.

```mermaid
graph TB;
    api --> data
	subgraph da[data abstraction]
		direction TB
		data --> data-driver-x --> db1[(datastore)]
		data --> data-driver-y --> db2[(datastore)]
	end
```

## Current architecture of this package

To get an overview of how the package is organized regarding it's files, directories and the dependencies between them,
run `pnpm run depcruise` and have a look in the created `dependency-graph.svg` image.
