---
description: A guide on how to build custom Modules in Directus.
readTime: 5 min read
---

# Custom Modules

> Custom Modules are completely open-ended components that allow you to create new experiences within the Directus
> platform. They are developed using Vue.js. [Learn more about Modules](/user-guide/overview/glossary#modules).

## Extension Entrypoint

The entrypoint of your module is the `index` file inside the `src/` folder of your extension package. It exports a
configuration object with options to configure the behavior of your module. When loading your module, this object is
imported by the Directus host.

Example of an entrypoint:

```js
import ModuleComponent from './module.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
};
```

#### Available Options

- `id` — The unique key for this module. It is good practice to scope proprietary modules with an author prefix.
- `name` — The human-readable name for this module.
- `icon` — An icon name from the [material icon set](/user-guide/overview/glossary#material-icons), or the extended list
  of Directus custom icons.
- `color` — A color associated with the module.
- `routes` — Details the routes in your module. The routes are registered as nested routes with the module's `id`
  serving as the base path.
- `hidden` — A boolean that indicates if the module should be hidden from the module bar.
- `preRegisterCheck` — A function that receives the current user as the first parameter and the permissions of this user
  as the second parameter. It should return a boolean that indicates if the check succeeded.

## Routes Array

The `routes` array of a module works very similar to Vue Router's `routes` array. The only difference is that the
module's routes are registered as child routes of the `/<module-id>` route.

The `routes` array should contain one or more route objects with a `path` property. Because the routes are registered as
child routes, the `path` property should be a relative path without a leading slash. As the button in the module bar
corresponding to your module links to the `/<module-id>` route, the `routes` array should contain a _root_ route with an
empty path.

If a route should render something, the route object should have a `component` property with a reference to a route
component.

To learn more about the properties of route objects, you can refer to the
[Vue Router Docs](https://next.router.vuejs.org/guide).

## Route Component

A single module can have multiple route components registered under different routes. Whenever a certain route is
visited, the corresponding route component is rendered, occupying the whole browser window. The route component has to
be Vue component. The most straightforward way to write a Vue component is to use the Vue Single File Component syntax.

Example of a route component using the Vue SFC syntax:

```vue
<template>
	<private-view title="My Custom Module">Content goes here...</private-view>
</template>

<script>
export default {};
</script>
```

A route component provides a blank canvas for creating anything you need. You can use the globally registered
`private-view` component to get access to Directus' page structure consisting of the module bar, the navigation, the
sidebar, the header and the main content area.

::: warning Enable the Module

Before a module appears in the module bar, the extension has to be enabled under Settings > Extensions, and the module
has to be enabled under Settings > Settings > Module Bar.

:::

::: warning Vue Version

The Directus App uses Vue 3. There might be 3rd party libraries that aren't yet compatible with Vue 3.

:::

## Accessing Internal Systems

To access internal systems like the API or the stores, you can use the `useApi()` and `useStores()` composables exported
by the `@directus/extensions-sdk` package. They can be used inside a `setup()` function like this:

```js
import { useApi, useStores } from '@directus/extensions-sdk';

export default {
	setup() {
		const api = useApi();

		const { useCollectionsStore } = useStores();
		const collectionsStore = useCollectionsStore();

		// ...
	},
};
```

::: tip Vue Options API

If you prefer to use the Vue Options API, you can inject the `api` and `stores` properties directly.

:::

## Guides

Learn how to build modules with our official guides:

<GuidesListExtensions type="Modules" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
