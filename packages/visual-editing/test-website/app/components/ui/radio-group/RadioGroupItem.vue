<script setup lang="ts">
import { cn } from '#shared/utils';
import { Circle } from 'lucide-vue-next';
import { RadioGroupIndicator, RadioGroupItem, type RadioGroupItemProps, useForwardProps } from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<RadioGroupItem
		v-bind="forwardedProps"
		:class="
			cn(
				'aspect-square h-4 w-4 rounded-full border border-foreground text-foreground ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				props.class,
			)
		"
	>
		<RadioGroupIndicator class="flex items-center justify-center">
			<Circle class="h-2.5 w-2.5 fill-current text-current" />
		</RadioGroupIndicator>
	</RadioGroupItem>
</template>
