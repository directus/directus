<script setup lang="ts">
import { cn } from '#shared/utils';
import {
	NavigationMenuContent,
	type NavigationMenuContentEmits,
	type NavigationMenuContentProps,
	useForwardPropsEmits,
} from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<NavigationMenuContentProps & { class?: HTMLAttributes['class'] }>();

const emits = defineEmits<NavigationMenuContentEmits>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;
	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<NavigationMenuContent
		v-bind="forwarded"
		:class="
			cn(
				'left-0 top-0 w-full  data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto',
				props.class,
			)
		"
	>
		<slot />
	</NavigationMenuContent>
</template>
