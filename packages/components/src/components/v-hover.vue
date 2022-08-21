<template>
	<component :is="tag" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
		<slot v-bind="{ hover }" />
	</component>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
	/** Time in ms until closing */
	closeDelay?: number;
	/** Time in ms until opening */
	openDelay?: number;
	/** Disables any intractability */
	disabled?: boolean;
	/** The type of element to wrap around the slot */
	tag?: string;
}

const props = withDefaults(defineProps<Props>(), {
	closeDelay: 0,
	openDelay: 0,
	disabled: false,
	tag: 'div',
});

const hover = ref<boolean>(false);

function onMouseEnter() {
	if (props.disabled === true) return;

	setTimeout(() => {
		hover.value = true;
	}, props.openDelay);
}

function onMouseLeave() {
	if (props.disabled === true) return;

	setTimeout(() => {
		hover.value = false;
	}, props.closeDelay);
}
</script>
