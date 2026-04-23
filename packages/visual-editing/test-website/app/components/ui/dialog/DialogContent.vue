<script setup lang="ts">
import { cn } from '#shared/utils';
import { X } from 'lucide-vue-next';
import {
	DialogClose,
	DialogContent,
	type DialogContentEmits,
	type DialogContentProps,
	DialogOverlay,
	DialogPortal,
	useForwardPropsEmits,
} from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class']; hideCloseButton?: boolean }>();
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = computed(() => {
	const { class: _, hideCloseButton: __, ...delegated } = props;
	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>
<template>
	<DialogPortal>
		<DialogOverlay
			class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<DialogContent
			v-bind="forwarded"
			:class="
				cn(
					'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
					props.class,
				)
			"
		>
			<slot />
			<DialogClose
				v-if="!props.hideCloseButton"
				class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
			>
				<X class="w-4 h-4" />
				<span class="sr-only">Close</span>
			</DialogClose>
		</DialogContent>
	</DialogPortal>
</template>
