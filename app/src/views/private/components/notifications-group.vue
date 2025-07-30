<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';
import { toRefs } from 'vue';
import NotificationItem from './notification-item.vue';

defineProps<{
	sidebarOpen?: boolean;
	noSidebar?: boolean;
}>();

const notificationsStore = useNotificationsStore();
const queue = toRefs(notificationsStore).queue;
</script>

<template>
	<transition-group
		class="notifications-group"
		:class="{ 'sidebar-open': sidebarOpen, 'no-sidebar': noSidebar }"
		name="slide-fade"
		tag="div"
	>
		<slot />
		<notification-item
			v-for="(notification, index) in queue"
			:id="notification.id"
			:key="notification.id"
			:title="notification.title"
			:text="notification.text"
			:icon="notification.icon"
			:type="notification.type"
			:loading="notification.loading"
			:progress="notification.progress"
			:tail="index === queue.length - 1"
			:dense="sidebarOpen === false"
			:show-close="notification.persist === true && notification.closeable !== false"
			:always-show-text="notification.alwaysShowText"
			:dismiss-icon="notification.dismissIcon"
			:dismiss-text="notification.dismissText"
			:dismiss-action="notification.dismissAction"
		/>
	</transition-group>
</template>

<style lang="scss" scoped>
.notifications-group {
	position: fixed;
	inset-block-end: 24px;
	inset-inline-end: 12px;
	z-index: 50;
	display: flex;
	flex-direction: column;
	align-items: end;
	inline-size: 256px;

	&.sidebar-open {
		inset-block-end: 76px;
	}

	@media (min-width: 960px) {
		&:not(.no-sidebar) {
			inset-block-end: 76px;
		}
	}
}

.notification-item {
	transition: all 400ms cubic-bezier(0, 0, 0.2, 1.25);
}

.slide-fade-enter-active {
	transform: translateX(0) scaleY(1) scaleX(1);
	opacity: 1;
}

.slide-fade-leave-active {
	position: absolute;
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
