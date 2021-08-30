<template>
	<div>{{ name }} - Collection: {{ props.collection }}</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { useLayoutState } from '@directus/extensions-sdk';

export default defineComponent({
	setup() {
		const layoutState = useLayoutState();
		const { props, name } = toRefs(layoutState.value);

		return { props, name };
	},
});
</script>
