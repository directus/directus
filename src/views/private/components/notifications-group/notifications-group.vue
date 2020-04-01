<template>
	<transition-group class="notifications-group" name="slide-fade" tag="div">
		<notification-item
			v-for="(notification, index) in queue"
			:key="notification.id"
			v-bind="notification"
			:tail="index === queue.length - 1"
			dense
		/>
	</transition-group>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import useNotificationsStore from '@/stores/notifications';
import NotificationItem from '../notification-item';

export default defineComponent({
	components: { NotificationItem },
	setup() {
		const notificationsStore = useNotificationsStore();
		const queue = toRefs(notificationsStore.state).queue;

		return { queue };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.notifications-group {
	position: fixed;
	top: 0;
	right: 8px;
	left: 8px;
	z-index: 50;
	width: 280px;
	direction: rtl;

	> * {
		direction: ltr;
	}

	@include breakpoint(medium) {
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

.slide-fade-enter {
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
