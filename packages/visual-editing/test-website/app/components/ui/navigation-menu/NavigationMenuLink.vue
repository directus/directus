<script setup lang="ts">
import { type NavigationMenuLinkEmits, type NavigationMenuLinkProps, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<NavigationMenuLinkProps>();
const emits = defineEmits<NavigationMenuLinkEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
	<NuxtLink v-bind="forwarded">
		<slot />
	</NuxtLink>
</template>
