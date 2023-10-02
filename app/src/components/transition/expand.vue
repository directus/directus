<script setup lang="ts">
import ExpandMethods from './expand-methods';

interface Props {
	/** Expand on the horizontal instead vertical axis */
	xAxis?: boolean;
	/** Add a custom class to the element that is expanded */
	expandedParentClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
	xAxis: false,
	expandedParentClass: '',
});

const emit = defineEmits([
	'beforeEnter',
	'enter',
	'afterEnter',
	'enterCancelled',
	'beforeLeave',
	'leave',
	'afterLeave',
	'leaveCancelled',
]);

const methods = ExpandMethods(props.expandedParentClass, props.xAxis, emit);
</script>

<template>
	<transition name="expand-transition" mode="in-out" v-on="methods">
		<slot />
	</transition>
</template>
