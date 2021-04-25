<template>
	<value-null v-if="value === null || !info" />
	<div v-else>
		<v-icon v-if="icon" :name="info.icon" left small />
		{{ info.name }}
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import useCollection from '@/composables/use-collection';

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
