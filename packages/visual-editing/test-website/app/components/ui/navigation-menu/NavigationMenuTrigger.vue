<script setup lang="ts">
import { cn } from '#shared/utils';
import { ChevronDown } from 'lucide-vue-next';
import { NavigationMenuTrigger, type NavigationMenuTriggerProps, useForwardProps } from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';
import { navigationMenuTriggerStyle } from '.';

const props = defineProps<NavigationMenuTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<NavigationMenuTrigger v-bind="forwardedProps" :class="cn(navigationMenuTriggerStyle(), 'group', props.class)">
		<slot />
		<ChevronDown
			class="relative top-px ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
			aria-hidden="true"
		/>
	</NavigationMenuTrigger>
</template>
