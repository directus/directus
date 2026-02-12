<script setup lang="ts">
import { computed, toRefs } from 'vue';
import NotificationItem from './notification-item.vue';
import { useNotificationsStore } from '@/stores/notifications';

const notificationsStore = useNotificationsStore();
const queue = toRefs(notificationsStore).queue;

const overlayIsActive = computed(() => notificationsStore.overlayIsActive);
</script>

<template>
	<TransitionGroup class="notifications-group" :class="{ overlay: overlayIsActive }" name="slide-fade" tag="div">
		<slot />
		<NotificationItem
			v-for="notification in queue"
			:id="notification.id"
			:key="notification.id"
			:title="notification.title"
			:text="notification.text"
			:icon="notification.icon"
			:type="notification.type"
			:loading="notification.loading"
			:progress="notification.progress"
			:show-reload="notification.showReload"
			:show-close="notification.persist === true && notification.closeable !== false"
			:always-show-text="notification.alwaysShowText"
			:dismiss-icon="notification.dismissIcon"
			:dismiss-text="notification.dismissText"
			:dismiss-action="notification.dismissAction"
		/>
	</TransitionGroup>
</template>

<style lang="scss" scoped>
.notifications-group {
	position: absolute;
	inset-block-end: 16px;
	inset-inline-end: 16px;
	z-index: 50;
	display: flex;
	flex-direction: column;
	align-items: end;
	inline-size: 256px;

	&.overlay {
		z-index: 700;
		position: fixed;
	}
}

.notification-item {
	transition: all 400ms cubic-bezier(0, 0, 0.2, 1.25);
}

.slide-fade-enter-active {
	transform: translateX(0) scaleY(1) scaleX(1);
	opacity: 1;
}

.slide-fade-enter-from {
	transform: translateX(50px) scaleY(0) scaleX(0);
	transform-origin: right bottom;
	opacity: 0;
}

.slide-fade-leave-to {
	transform: translateX(50px) scaleX(0);
	transform-origin: right;
	opacity: 0;
	transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
	transition-duration: 200ms;
}
</style>
