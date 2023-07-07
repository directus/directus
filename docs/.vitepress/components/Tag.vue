<template>
	<component :is="tagType" class="badge" v-bind="tagProps">
		<slot />
	</component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		as: string;
		href: string;
	}>(),
	{
		as: 'div',
	}
);

const tagType = computed(() => (props.href ? 'a' : 'div'));
const tagProps = computed(() => (props.href ? { href: props.href } : {}));
</script>

<style scoped>
.badge {
	font-weight: 500;
	color: var(--vp-c-gray);
	background: var(--vp-c-gray-light-5);
	display: flex;
	margin-top: 0.75em;
	padding: 0.25em 0.75em;
	border-radius: 8px;
}
</style>
