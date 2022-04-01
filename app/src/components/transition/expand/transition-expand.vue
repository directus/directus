<template>
	<transition name="expand-transition" mode="in-out" v-on="methods">
		<slot />
	</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
	emits: ['beforeEnter', 'enter', 'afterEnter', 'enterCancelled', 'leave', 'afterLeave', 'leaveCancelled'],
	setup(props, { emit }) {
		const methods = ExpandMethods(props.expandedParentClass, props.xAxis, emit);
		return { methods };
	},
});
</script>
