# Public View Logo

Renders the Directus logo and shows the current version of Directus on hover.

## Usage

```html
<template>
	<public-view-logo version="9.0.0" />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import PublicViewLogo from '@/views/public/components/logo';

export default {
	components: {
		PublicViewLogo
	}
}
</script>
```

## Props
| Prop      | Description                     | Default |
|-----------|---------------------------------|---------|
| `version` | The version to display on hover | --      |

## Events
n/a

## Slots
n/a

## CSS Variables
n/a
