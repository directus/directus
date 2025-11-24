<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';
import { computed, toRefs } from 'vue';
import { useSidebarStore } from '../private-view/stores/sidebar';
import NotificationItem from './notification-item.vue';

const sidebarStore = useSidebarStore();

const insetInlineEnd = computed(() => {
	if (sidebarStore.collapsed) {
		return '78px';
	}

	return Math.max(296, Math.min(616, sidebarStore.size + 16)) + 'px';
});

const notificationsStore = useNotificationsStore();
const queue = toRefs(notificationsStore).queue;
</script>

<template>
	<transition-group class="notifications-group" name="slide-fade" tag="div">
		<slot />
		<notification-item
			v-for="notification in queue"
			:id="notification.id"
			:key="notification.id"
			:title="notification.title"
			:text="notification.text"
			:icon="notification.icon"
			:type="notification.type"
			:loading="notification.loading"
			:progress="notification.progress"
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
	inset-block-end: 16px;
	inset-inline-end: v-bind(insetInlineEnd);
	z-index: 50;
	display: flex;
	flex-direction: column;
	align-items: end;
	inline-size: 256px;
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
