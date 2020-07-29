<template>
	<transition name="expand-transition" mode="in-out" v-on="methods">
		<slot />
	</transition>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import ExpandMethods from './transition-expand-methods';

export default defineComponent({
	props: {
		xAxis: {
			type: Boolean,
			default: false,
		},
		expandedParentClass: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const methods = ExpandMethods(props.expandedParentClass, props.xAxis);
		return { methods };
	},
});
</script>
