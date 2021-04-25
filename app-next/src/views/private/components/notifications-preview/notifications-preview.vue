<template>
	<div class="notifications-preview">
		<transition-expand tag="div">
			<div v-if="active" class="inline">
				<div class="padding-box">
					<router-link class="link" to="/activity" :class="{ 'has-items': lastFour.length > 0 }">
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

		<sidebar-button
			:active="active"
			@click="$emit('input', !active)"
			v-tooltip.left="$t('notifications')"
			class="toggle"
			icon="notifications"
		>
			{{ $t('notifications') }}
		</sidebar-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import SidebarButton from '../sidebar-button';
import NotificationItem from '../notification-item';
import { useNotificationsStore } from '@/stores/';

export default defineComponent({
	components: { SidebarButton, NotificationItem },
	model: {
		prop: 'active',
	},
	props: {
		sidebarOpen: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const notificationsStore = useNotificationsStore();
		return { lastFour: notificationsStore.lastFour };
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

	&.has-items {
		margin-bottom: 12px;
	}
}

.transition {
	position: relative;
	width: 100%;
}

.sidebar-button {
	background-color: var(--background-normal-alt);
}

.inline {
	position: absolute;
	right: 0;
	bottom: 100%;
	width: 100%;
	background-color: var(--background-normal);
	box-shadow: 0px -4px 12px rgba(38, 50, 56, 0.1);

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
