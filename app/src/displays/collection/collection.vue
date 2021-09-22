<template>
	<value-null v-if="value === null || !info" />
	<div v-else>
		<v-icon v-if="icon" :name="info.icon" left small />
		{{ info.name }}
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { useCollection } from '@directus/shared/composables';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		icon: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const collection = toRefs(props).value;
		const { info } = useCollection(collection);

		return { info };
	},
});
</script>
