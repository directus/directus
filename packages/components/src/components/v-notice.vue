<template>
	<div class="v-notice" :class="[type, { center }]">
		<v-icon v-if="icon !== false" :name="iconName" left />
		<slot />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** Renders the components in each of it styles */
	type?: 'normal' | 'info' | 'success' | 'warning' | 'danger';
	/** Custom icon name, or false if you want to hide the icon completely */
	icon?: string | boolean | null;
	/** Render notice content centered */
	center?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	icon: null,
	type: 'normal',
	center: false,
});

const iconName = computed(() => {
	if (props.icon !== false && typeof props.icon === 'string') {
		return props.icon;
	}

	if (props.type == 'info') {
		return 'info';
	} else if (props.type == 'success') {
		return 'check_circle';
	} else if (props.type == 'warning') {
		return 'warning';
	} else if (props.type == 'danger') {
		return 'error';
	} else {
		return 'info';
	}
});
</script>

<style scoped>
:global(body) {
	--v-notice-color: var(--foreground-subdued);
	--v-notice-background-color: var(--background-subdued);
	--v-notice-border-color: var(--background-subdued);
	--v-notice-icon-color: var(--foreground-subdued);
}

.v-notice {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: auto;
	min-height: var(--input-height);
	padding: 12px 16px;
	color: var(--v-notice-color);
	line-height: 22px;
	background-color: var(--v-notice-background-color);
	border-radius: var(--border-radius);
	overflow: hidden;
}

.v-notice::after {
	content: '';
	display: block;
	position: absolute;
	top: 0;
	left: 0;
	width: 4px;
	height: 100%;
	background-color: var(--v-notice-border-color);
}

.v-icon {
	--v-icon-color: var(--v-notice-icon-color);
}

.v-icon.left {
	margin-right: 16px;
}

.info {
	--v-notice-icon-color: var(--primary);
	--v-notice-border-color: var(--primary);
	--v-notice-color: var(--foreground-normal);
	--v-notice-background-color: var(--background-normal);
}

.success {
	--v-notice-icon-color: var(--success);
	--v-notice-border-color: var(--success);
	--v-notice-color: var(--success);
	--v-notice-background-color: var(--background-normal);
}

.warning {
	--v-notice-icon-color: var(--warning);
	--v-notice-border-color: var(--warning);
	--v-notice-color: var(--foreground-normal);
	--v-notice-background-color: var(--background-normal);
}

.danger {
	--v-notice-icon-color: var(--danger);
	--v-notice-border-color: var(--danger);
	--v-notice-color: var(--danger);
	--v-notice-background-color: var(--background-normal);
}

.center {
	display: flex;
	align-items: center;
	justify-content: center;
}

:slotted(a) {
	text-decoration: underline;
}
</style>
