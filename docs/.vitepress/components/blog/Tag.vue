<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		as: string;
		href: string;
	}>(),
	{
		as: 'div',
	},
);

const tagType = computed(() => (props.href ? 'a' : 'div'));
const tagProps = computed(() => (props.href ? { href: props.href } : {}));
</script>

<template>
	<component :is="tagType" class="badge" v-bind="tagProps">
		<slot />
	</component>
</template>

<style scoped>
.badge {
	font-weight: 500;
	color: var(--vp-c-gray);
	display: flex;
	font-size: 0.75em;
}
.dark .badge {
	color: var(--vp-c-gray-light);
}
</style>
