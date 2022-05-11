<template>
	<div class="v-notice" :class="[type, { center }]">
		<v-icon v-if="icon !== false" :name="iconName" left />
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'normal' | 'info' | 'success' | 'warning' | 'danger'>,
			default: 'normal',
		},
		icon: {
			type: [String, Boolean],
			default: null,
		},
		center: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
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

		return { iconName };
	},
});
</script>

<style>
body {
	--v-notice-color: var(--g-color-foreground-subtle);
	--v-notice-background-color: var(--g-color-background-subtle);
	--v-notice-border-color: var(--g-color-background-subtle);
	--v-notice-icon-color: var(--g-color-foreground-subtle);
}
</style>

<style scoped>
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
	border-radius: var(--g-border-radius);
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
	--v-notice-icon-color: var(--g-color-primary-normal);
	--v-notice-border-color: var(--g-color-primary-normal);
	--v-notice-color: var(--g-color-foreground-normal);
	--v-notice-background-color: var(--g-color-background-normal);
}

.success {
	--v-notice-icon-color: var(--g-color-success-normal);
	--v-notice-border-color: var(--g-color-success-normal);
	--v-notice-color: var(--g-color-success-normal);
	--v-notice-background-color: var(--g-color-background-normal);
}

.warning {
	--v-notice-icon-color: var(--g-color-warning-normal);
	--v-notice-border-color: var(--g-color-warning-normal);
	--v-notice-color: var(--g-color-foreground-normal);
	--v-notice-background-color: var(--g-color-background-normal);
}

.danger {
	--v-notice-icon-color: var(--g-color-danger-normal);
	--v-notice-border-color: var(--g-color-danger-normal);
	--v-notice-color: var(--g-color-danger-normal);
	--v-notice-background-color: var(--g-color-background-normal);
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
