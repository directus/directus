<script setup lang="ts">
import { NavigationMenuItem, type NavigationMenuItemProps } from 'radix-vue';

const props = defineProps<NavigationMenuItemProps>();
</script>

<template>
	<NavigationMenuItem v-bind="props">
		<slot />
	</NavigationMenuItem>
</template>
