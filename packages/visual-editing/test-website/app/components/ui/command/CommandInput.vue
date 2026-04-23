<script setup lang="ts">
import { cn } from '#shared/utils';
import { Search } from 'lucide-vue-next';
import { ComboboxInput, type ComboboxInputProps, useForwardProps } from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

defineOptions({
	inheritAttrs: false,
});

const props = defineProps<
	ComboboxInputProps & {
		class?: HTMLAttributes['class'];
	}
>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<div class="flex items-center border-b px-3" cmdk-input-wrapper>
		<Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
		<ComboboxInput
			v-bind="{ ...forwardedProps, ...$attrs }"
			auto-focus
			:class="
				cn(
					'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
					props.class,
				)
			"
		/>
	</div>
</template>
