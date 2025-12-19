<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useNotificationsStore } from '@/stores/notifications';

const props = withDefaults(
	defineProps<{
		id: string;
		title: string;
		text?: string;
		icon?: string | null;
		type?: 'info' | 'success' | 'warning' | 'error';
		showClose?: boolean;
		loading?: boolean;
		progress?: number;
		alwaysShowText?: boolean;
		dismissText?: string;
		dismissIcon?: string;
		dismissAction?: () => void | Promise<void>;
	}>(),
	{
		type: 'info',
	},
);

const notificationsStore = useNotificationsStore();

const done = async () => {
	if (props.showClose === true) {
		if (props.dismissAction) {
			await props.dismissAction();
		}

		notificationsStore.remove(props.id);
	}
};
</script>

<template>
	<div class="notification-item" :class="[type, { 'show-text': alwaysShowText }]" @click="done">
		<div v-if="loading || progress || icon" class="icon">
			<VProgressCircular v-if="loading" indeterminate small />
			<VProgressCircular v-else-if="progress" small :value="progress" />
			<VIcon v-else :name="icon" />
		</div>

		<div class="content">
			<p class="title">{{ title }}</p>
			<p v-if="text" class="text">{{ text }}</p>
		</div>

		<VIcon
			v-if="showClose"
			v-tooltip="dismissText"
			:name="dismissIcon ?? 'close'"
			clickable
			class="close"
			@click="done"
		/>
	</div>
</template>

<style lang="scss" scoped>
.notification-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	margin-block-start: 4px;
	padding: 12px;
	color: var(--white);
	border-radius: var(--theme--border-radius);
	inline-size: max-content;
	max-inline-size: 100%;
	min-block-size: 44px;

	.icon {
		display: block;
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		inline-size: auto;
		block-size: auto;
		margin-inline-end: 8px;
		background-color: transparent;
	}

	.text {
		hyphens: auto;
	}

	.content {
		flex-grow: 1;
	}

	.title {
		font-weight: 600;
	}

	&::after {
		position: absolute;
		inset-inline-end: 12px;
		inset-block-end: -5px;
		z-index: -1;
		display: block;
		inline-size: 20px;
		block-size: 20px;
		border-radius: 2px;
		transform: rotate(45deg) translate(-5px, -5px);
		transition: transform var(--slow) var(--transition);
		content: '';
		pointer-events: none;
	}

	&:not(.show-text) .text {
		display: none;
	}

	&.info {
		background-color: var(--theme--primary);

		.text {
			color: var(--theme--primary-background);
		}
	}

	&.success {
		background-color: var(--theme--success);

		.text {
			color: var(--success-alt);
		}
	}

	&.warning {
		background-color: var(--theme--warning);

		.text {
			color: var(--warning-alt);
		}
	}

	&.error {
		background-color: var(--theme--danger);

		.text {
			color: var(--danger-alt);
		}
	}
}

.close {
	margin-inline-start: 12px;
}

.v-progress-circular {
	--v-progress-circular-color: var(--foreground-inverted);
	--v-progress-circular-background-color: transparent;
}
</style>
