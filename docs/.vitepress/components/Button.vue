<script setup lang="ts">
import { computed, type Component } from 'vue';

const props = defineProps<{
	secondary?: boolean;
	href?: string;
	external?: boolean;
	icon?: Component;
}>();

const component = computed(() => {
	if (props.href) return 'a';
	return 'button';
});

const additionalProps = computed(() => {
	if (component.value === 'a') {
		return {
			...(props.href && { href: props.href }),
			...(props.external && {
				target: '_blank',
				rel: 'noopener noreferrer',
			}),
		};
	}

	return {};
});
</script>

<template>
	<component :is="component" class="button" :class="{ primary: !secondary, secondary }" v-bind="additionalProps">
		<slot />
		<component :is="icon" v-if="icon" class="icon" />
	</component>
</template>

<style scoped>
.button {
	display: inline-flex;
	align-items: center;
	border: 1px solid;
	border-color: var(--vp-c-divider);
	border-radius: 12px;
	color: var(--vp-c-text-1);
	font-weight: 600;
	font-size: 14px;
	margin-top: 10px;
	padding: 4px 12px;
}

.primary {
	background: white;
	color: #0e1c2f;
	font-size: 16px;
	padding: 12px 16px;
}

.primary:hover {
	opacity: 1;
	background-color: #f0f4f9;
}

.secondary {
	border: none;
	padding: 16px;
	color: var(--white);
	opacity: 0.8;
}

.secondary:hover {
	opacity: 1;
}

.icon {
	margin-left: 6px;
}
</style>
