<template>
	<div class="notifications-preview">
		<transition-expand tag="div">
			<div v-if="active" class="inline">
				<div class="padding-box">
					<router-link class="link" :to="activityLink">
						{{ $t('show_all_activity') }}
					</router-link>
					<transition-group tag="div" name="notification" class="transition">
						<notification-item
							v-for="notification in lastFour"
							:key="notification.id"
							v-bind="notification"
						/>
					</transition-group>
				</div>
			</div>
		</transition-expand>

		<drawer-button
			:active="active"
			@click="$emit('toggle', !active)"
			class="toggle"
			icon="notifications"
		>
			{{ $t('notifications') }}
		</drawer-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import DrawerButton from '../drawer-button';
import NotificationItem from '../notification-item';
import useNotificationsStore from '@/stores/notifications';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	components: { DrawerButton, NotificationItem },
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const notificationsStore = useNotificationsStore();
		const projectsStore = useProjectsStore();
		const activityLink = computed(() => `/${projectsStore.state.currentProjectKey}/activity`);

		return { lastFour: notificationsStore.lastFour, activityLink };
	},
});
</script>

<style lang="scss" scoped>
.notifications-preview {
	position: relative;
}

.link {
	display: block;
	color: var(--foreground-subdued);
	text-align: center;
	text-decoration: none;

	&:hover {
		color: var(--foreground-normal);
	}
}

.transition {
	position: relative;
	width: 100%;
}

.inline {
	position: absolute;
	right: 0;
	bottom: 100%;
	width: 100%;

	.padding-box {
		position: relative;
		width: 100%;
		padding: 12px;
	}
}

.notification-enter-active,
.notification-leave-active {
	transition: all var(--slow) var(--transition);
}

.notification-leave-active {
	position: absolute;
}

.notification-move {
	transition: all 500ms var(--transition);
}

.notification-enter,
.notification-leave-to {
	opacity: 0;
}
</style>
