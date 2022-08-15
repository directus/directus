<template>
	<component :is="tag" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
		<slot v-bind="{ hover }" />
	</component>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
	closeDelay?: number;
	openDelay?: number;
	disabled?: boolean;
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
