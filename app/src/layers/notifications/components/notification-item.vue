<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';

const props = withDefaults(
	defineProps<{
		id: string;
		title: string;
		text?: string;
		icon?: string | null;
		type?: 'info' | 'success' | 'warning' | 'error';
		tail?: boolean;
		dense?: boolean;
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
	<div class="notification-item" :class="[type, { tail, dense, 'show-text': alwaysShowText }]" @click="done">
		<div v-if="loading || progress || icon" class="icon">
			<v-progress-circular v-if="loading" indeterminate small />
			<v-progress-circular v-else-if="progress" small :value="progress" />
			<v-icon v-else :name="icon" />
		</div>

		<div class="content">
			<p class="title">{{ title }}</p>
			<p v-if="text" class="text">{{ text }}</p>
		</div>

		<v-icon
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
	inline-size: 100%;
	min-block-size: 44px;
	margin-block-start: 4px;
	padding: 12px;
	color: var(--white);
	border-radius: var(--theme--border-radius);

	.icon {
		display: block;
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		inline-size: 44px;
		block-size: 44px;
		margin-inline-end: 12px;
		background-color: rgb(255 255 255 / 0.25);
		border-radius: 50%;
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

	&.tail::after {
		transform: rotate(45deg) translate(0, 0);
	}

	&.dense {
		inline-size: max-content;
		max-inline-size: 100%;
		min-block-size: 44px;

		.icon {
			inline-size: auto;
			block-size: auto;
			margin-inline-end: 8px;
			background-color: transparent;
		}

		&:not(.show-text) .text {
			display: none;
		}
	}

	&.info {
		background-color: var(--theme--primary);

		&.tail::after {
			background-color: var(--theme--primary);
		}

		.text {
			color: var(--theme--primary-background);
		}
	}

	&.success {
		background-color: var(--theme--success);

		&.tail::after {
			background-color: var(--theme--success);
		}

		.text {
			color: var(--success-alt);
		}
	}

	&.warning {
		background-color: var(--theme--warning);

		&.tail::after {
			background-color: var(--theme--warning);
		}

		.text {
			color: var(--warning-alt);
		}
	}

	&.error {
		background-color: var(--theme--danger);

		&.tail::after {
			background-color: var(--theme--danger);
		}

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
