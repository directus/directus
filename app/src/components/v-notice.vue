<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** Renders the components in each of it styles */
	type?: 'info' | 'success' | 'warning' | 'danger';
	/** Custom icon name, or false if you want to hide the icon completely */
	icon?: string | boolean | null;
	/** Render notice content centered */
	center?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	icon: null,
	type: 'info',
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

<template>
	<div class="v-notice" :class="[type, { center }]">
		<v-icon v-if="icon !== false" :name="iconName" left />
		<slot />
	</div>
</template>

<style scoped>
/*

	Available Variables:

		--v-notice-color             [var(--theme--foreground)]
		--v-notice-background-color  [var(--theme--background-normal)]
		--v-notice-border-color      [var(--theme--primary)]
		--v-notice-icon-color        [var(--theme--primary)]
*/

.v-notice {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: auto;
	min-height: var(--theme--form--field--input--height);
	padding: 12px 16px;
	color: var(--v-notice-color, var(--theme--foreground));
	line-height: 22px;
	background-color: var(--v-notice-background-color, var(--theme--background-normal));
	border-radius: var(--theme--border-radius);
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
	background-color: var(--v-notice-border-color, var(--theme--primary));
}

.v-icon {
	--v-icon-color: var(--v-notice-icon-color, var(--theme--primary));
}

.v-icon.left {
	margin-right: 16px;
}

.success {
	--v-notice-icon-color: var(--theme--success);
	--v-notice-border-color: var(--theme--success);
	--v-notice-color: var(--theme--success);
	--v-notice-background-color: var(--theme--background-normal);
}

.warning {
	--v-notice-icon-color: var(--theme--warning);
	--v-notice-border-color: var(--theme--warning);
	--v-notice-color: var(--theme--foreground);
	--v-notice-background-color: var(--theme--background-normal);
}

.danger {
	--v-notice-icon-color: var(--theme--danger);
	--v-notice-border-color: var(--theme--danger);
	--v-notice-color: var(--theme--danger);
	--v-notice-background-color: var(--theme--background-normal);
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
