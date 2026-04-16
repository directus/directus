<script setup lang="ts">
import { cn } from '#shared/utils';
import { NavigationMenuIndicator, type NavigationMenuIndicatorProps, useForwardProps } from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<NavigationMenuIndicatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<NavigationMenuIndicator
		v-bind="forwardedProps"
		:class="
			cn(
				'top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in',
				props.class,
			)
		"
	>
		<div class="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
	</NavigationMenuIndicator>
</template>
