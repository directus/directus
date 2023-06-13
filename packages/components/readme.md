# Views

> **Warning**\
> This is a work in progress, and is not intended for production use.

This package will contain the basic page views used in the Directus app. This includes the Public, Private, and Shared
view.

## Usage

```
pnpm add @directus/views
```

```vue
<script setup lang="ts">
import { PrivateView } from '@directus/views';
</script>

<template>
	<PrivateView />
</template>
```
