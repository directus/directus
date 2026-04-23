<script setup lang="ts">
import { cn } from '#shared/utils';
import { NavigationMenuViewport, type NavigationMenuViewportProps, useForwardProps } from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<div class="absolute left-0 top-full flex justify-center">
		<NavigationMenuViewport
			v-bind="forwardedProps"
			:class="
				cn(
					'origin-top-center relative mt-1.5 h-[--radix-navigation-menu-viewport-height] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[--radix-navigation-menu-viewport-width]',
					props.class,
				)
			"
		/>
	</div>
</template>
