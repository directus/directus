# Custom Operations

> Custom Operations allow you to create new types of steps for flows. They are developed using JavaScript / Node.js.
> [Learn more about Operations](/app/flows/operations).

## Extension Entrypoints

Your operation has two entrypoints. The App entrypoint is the `app` file and the API entrypoint is the `api` file inside
the `src/` folder of your extension package.

### App Entrypoint

The App entrypoint exports a configuration object with options to configure the appearance of your operation. When
loading your operation, this object is imported by the Directus App host.

Example of an entrypoint:

```js
export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom operation!',
	overview: ({ text }) => [
		{
			label: 'Text',
			text: text,
		},
	],
	options: [
		{
			field: 'text',
			name: 'Text',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
};
```

#### Available Options

- `id` — The unique key for this operation. It is good practice to scope proprietary operations with an author prefix.
- `name` — The human-readable name for this operation.
- `icon` — An icon name from the [material icon set](/user-guide/overview/glossary#material-icons), or the extended list
  of Directus custom icons.
- `description` — A short description (<80 characters) of this operation shown in the App.
- `overview` — An overview that will be shown on the operation's tile. Can be either a function that receives the
  options of the operation and returns an array of objects containing `label` and `text` or a dedicated Vue component.
- `options` — The options of your operation. Can be either an options object or a dedicated Vue component.

### API Entrypoint

The API entrypoint exports a configuration object with options to configure the behavior of your operation. When loading
your operation, this object is imported by the Directus API host.

Example of an entrypoint:

```js
export default {
	id: 'custom',
	handler: ({ text }) => {
		console.log(text);
	},
};
```

#### Available Options

- `id` — The unique key for this operation. It is good practice to scope proprietary operations with an author prefix.
- `handler` — The operations's handler function.

::: warning Extension Id

The extension id needs to be identical for both entrypoints in order for Directus to recognize them as part of the same
extension.

:::

## Handler Function

The handler function defined inside the API endpoint will be called whenever the flow the operation is connected to is
executed. To trigger the operation connected to the `resolve` anchor, the handler function has to return a value. To
trigger the operation connected to the `reject` anchor, the handler function has to throw with a value. This value will
then be added to the [data chain](/app/flows#the-data-chain).

The handler function receives the two parameters `options` and `context`. `options` is an object with the operation's
options as properties and their respective already interpolated values. `context` is an object with the following
properties:

- `services` — All API internal services.
- `database` — Knex instance that is connected to the current database.
- `getSchema` — Async function that reads the full available schema for use in services
- `env` — Parsed environment variables.
- `logger` — [Pino](https://github.com/pinojs/pino) instance.
- `data` — Object containing the raw data returned by the previous operations.
- `accountability` — Information about the current user received by the trigger.

## Guides

Learn how to build operations with our official guides:

<GuidesListExtensions type="Operations" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
