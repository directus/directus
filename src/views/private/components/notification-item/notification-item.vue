<template>
	<div class="notification-item" :class="[type, { tail, dense }]" @click="close">
		<div class="icon" v-if="icon">
			<v-icon :name="icon" />
		</div>

		<div class="content">
			<p class="title selectable">{{ title }}</p>
			<p v-if="text" class="text selectable">{{ text }}</p>
		</div>

		<v-icon v-if="persist" name="close" @click="close" class="close" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useNotificationsStore from '@/stores/notifications';

export default defineComponent({
	props: {
		id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		text: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		type: {
			type: String,
			default: 'info',
			validator: (val: string) => ['info', 'success', 'warning', 'error'].includes(val),
		},
		persist: {
			type: Boolean,
			default: false,
		},
		tail: {
			type: Boolean,
			default: false,
		},
		dense: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const notificationsStore = useNotificationsStore();

		if (props.persist !== true) {
			setTimeout(() => {
				close();
			}, 3000);
		}

		return { close };

		function close() {
			notificationsStore.remove(props.id);
		}
	},
});
</script>

<style lang="scss" scoped>
.notification-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
	min-height: 64px;
	margin-bottom: 4px;
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
		background-color: rgba(255, 255, 255, 0.25);
		border-radius: 50%;
	}

	.content {
		flex-grow: 1;
	}

	.title {
		font-weight: 500;
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
</style>
