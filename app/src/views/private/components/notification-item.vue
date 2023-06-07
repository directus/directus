<template>
	<div class="notification-item" :class="[type, { tail, dense }]" @click="close">
		<div v-if="loading || progress || icon" class="icon">
			<v-progress-circular v-if="loading" indeterminate small />
			<v-progress-circular v-else-if="progress" small :value="progress" />
			<v-icon v-else :name="icon" />
		</div>

		<div class="content">
			<p class="title selectable">{{ title }}</p>
			<p v-if="text" class="text selectable">{{ text }}</p>
		</div>

		<v-icon v-if="showClose" name="close" clickable class="close" @click="close" />
	</div>
</template>

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
	}>(),
	{
		type: 'info',
	}
);

const notificationsStore = useNotificationsStore();

function close() {
	if (props.showClose === true) {
		notificationsStore.remove(props.id);
	}
}
</script>

<style lang="scss" scoped>
.notification-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
	min-height: 44px;
	margin-top: 4px;
	padding: 12px;
	color: var(--white);
	border-radius: var(--border-radius);

	.icon {
		display: block;
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-right: 12px;
		background-color: rgb(255 255 255 / 0.25);
		border-radius: 50%;
	}

	.content {
		flex-grow: 1;
	}

	.title {
		font-weight: 600;
	}

	&::after {
		position: absolute;
		right: 12px;
		bottom: -5px;
		z-index: -1;
		display: block;
		width: 20px;
		height: 20px;
		border-radius: 2px;
		transform: rotate(45deg) translate(-5px, -5px);
		transition: transform var(--slow) var(--transition);
		content: '';
		pointer-events: none;
	}

	&.tail::after {
		transform: rotate(45deg) translate(0px, 0px);
	}

	&.dense {
		width: max-content;
		max-width: 100%;
		min-height: 44px;

		.icon {
			width: auto;
			height: auto;
			margin-right: 8px;
			background-color: transparent;
		}

		.text {
			display: none;
		}
	}

	&.info {
		background-color: var(--primary);

		&.tail::after {
			background-color: var(--primary);
		}

		.text {
			color: var(--primary-alt);
		}
	}

	&.success {
		background-color: var(--success);

		&.tail::after {
			background-color: var(--success);
		}

		.text {
			color: var(--success-alt);
		}
	}

	&.warning {
		background-color: var(--warning);

		&.tail::after {
			background-color: var(--warning);
		}

		.text {
			color: var(--warning-alt);
		}
	}

	&.error {
		background-color: var(--danger);

		&.tail::after {
			background-color: var(--danger);
		}

		.text {
			color: var(--danger-alt);
		}
	}
}

.v-progress-circular {
	--v-progress-circular-color: var(--foreground-inverted);
	--v-progress-circular-background-color: transparent;
}
</style>
