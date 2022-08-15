<template>
	<transition name="expand-transition" mode="in-out" v-on="methods">
		<slot />
	</transition>
</template>

<script setup lang="ts">
import ExpandMethods from './expand-methods';

const props = withDefaults(
	defineProps<{
		xAxis?: boolean;
		expandedParentClass?: string;
	}>(),
	{
		xAxis: false,
		expandedParentClass: '',
	}
);

const emit = defineEmits([
	'beforeEnter',
	'enter',
	'afterEnter',
	'enterCancelled',
	'leave',
	'afterLeave',
	'leaveCancelled',
]);

const methods = ExpandMethods(props.expandedParentClass, props.xAxis, emit);
</script>
