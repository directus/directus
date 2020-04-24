<template>
	<div class="v-notice" :class="className">
		<v-icon v-if="icon !== false" :name="iconName" left />
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		success: {
			type: Boolean,
			default: false,
		},
		warning: {
			type: Boolean,
			default: false,
		},
		danger: {
			type: Boolean,
			default: false,
		},
		icon: {
			type: [String, Boolean],
			default: null,
		},
	},
	setup(props) {
		const iconName = computed(() => {
			if (props.icon !== false && typeof props.icon === 'string') {
				return props.icon;
			}

			if (props.success) {
				return 'check_circle';
			} else if (props.warning) {
				return 'warning';
			} else if (props.danger) {
				return 'error';
			} else {
				return 'info';
			}
		});

		const className = computed<string | null>(() => {
			if (props.success) {
				return 'success';
			} else if (props.warning) {
				return 'warning';
			} else if (props.danger) {
				return 'danger';
			} else {
				return null;
			}
		});

		return { iconName, className };
	},
});
</script>

<style>
body {
	--v-notice-color: var(--primary);
	--v-notice-background-color: var(--primary-alt);
	--v-notice-icon-color: var(--primary);
}
</style>

<style lang="scss" scoped>
.v-notice {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: auto;
	min-height: var(--input-height);
	padding: 12px 16px;
	color: var(--v-notice-color);
	background-color: var(--v-notice-background-color);
	border-radius: var(--border-radius);

	.v-icon {
		--v-icon-color: var(--v-notice-icon-color);
	}

	&.success {
		--v-notice-icon-color: var(--success);
		--v-notice-background-color: var(--success-alt);
		--v-notice-color: var(--success);
	}

	&.warning {
		--v-notice-icon-color: var(--warning);
		--v-notice-background-color: var(--warning-alt);
		--v-notice-color: var(--warning);
	}

	&.danger {
		--v-notice-icon-color: var(--danger);
		--v-notice-background-color: var(--danger-alt);
		--v-notice-color: var(--danger);
	}
}
</style>
