<template>
	<div class="v-notice" :class="[type, { center }]">
		<v-icon v-if="icon !== false" :name="iconName" left />
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';

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
	--v-notice-color: var(--foreground-subdued);
	--v-notice-background-color: var(--background-subdued);
	--v-notice-icon-color: var(--foreground-subdued);
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

	&.info {
		--v-notice-icon-color: var(--primary);
		--v-notice-background-color: var(--background-normal);
		--v-notice-color: var(--foreground-normal);
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

	&.center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	::v-deep {
		a {
			text-decoration: underline;
		}
	}
}
</style>
