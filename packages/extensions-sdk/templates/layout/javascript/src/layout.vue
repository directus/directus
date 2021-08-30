<template>
	<div>{{ name }} - Collection: {{ props.collection }}</div>
</template>

<script>
import { toRefs } from 'vue';
import { useLayoutState } from '@directus/extensions-sdk';

export default {
	setup() {
		const layoutState = useLayoutState();
		const { props, name } = toRefs(layoutState.value);

		return { props, name };
	},
};
</script>
