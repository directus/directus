<template>
	<transition-group class="notifications-group" :class="{ 'sidebar-open': sidebarOpen }" name="slide-fade" tag="div">
		<slot />
		<notification-item
			v-for="(notification, index) in queue"
			:id="notification.id"
			:key="notification.id"
			:title="notification.title"
			:icon="notification.icon"
			:type="notification.type"
			:loading="notification.loading"
			:progress="notification.progress"
			:tail="index === queue.length - 1"
			:dense="sidebarOpen === false"
			:show-close="notification.persist === true && notification.closeable !== false"
		/>
	</transition-group>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';
import { toRefs } from 'vue';
import NotificationItem from './notification-item.vue';

defineProps<{
	sidebarOpen?: boolean;
}>();

const notificationsStore = useNotificationsStore();
const queue = toRefs(notificationsStore).queue;
</script>

<style lang="scss" scoped>
.notifications-group {
	position: fixed;
	top: 0;
	right: 8px;
	left: 8px;
	z-index: 50;
	width: 256px;
	direction: rtl;

	> *,
	> :deep(*) {
		direction: ltr;
	}

	&.sidebar-open {
		top: auto;
		right: 12px;
		bottom: 76px;
		left: auto;
	}

	@media (min-width: 960px) {
		top: auto;
		right: 12px;
		bottom: 76px;
		left: auto;
	}
}

.notification-item {
	transition: all 400ms cubic-bezier(0, 0, 0.2, 1.25);
}

.slide-fade-enter-active {
	transform: translateX(0px) scaleY(1) scaleX(1);
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
