<script lang="ts">
export interface PrivateViewProps {
	/** Title to show in the header bar. Can be overriden through the #title slot */
	title?: string;

	/** Render an icon before the title */
	icon?: string;

	/** What color to render the icon in */
	iconColor?: string;

	/** Render a history back button in place of the title prepend icon */
	showBack?: boolean;

	/** Where to navigate to on back button click. Defaults to last page in the browser history */
	backTo?: string;

	/** Whether to always show sidebar shadows regardless of scroll state (true) or only when horizontally scrolled (false). */
	sidebarShadow?: boolean;

	/** Override header shadow state. When provided, bypasses internal scroll-based calculation. */
	showHeaderShadow?: boolean;
}
</script>

<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed } from 'vue';
import LicenseBanner from '../../components/license-banner.vue';
import NotificationDialogs from '../../components/notification-dialogs.vue';
import NotificationsDrawer from '../../components/notifications-drawer.vue';
import PrivateViewNoAppAccess from './private-view-no-app-access.vue';
import PrivateViewRoot from './private-view-root.vue';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';

defineProps<PrivateViewProps>();
defineOptions({ inheritAttrs: false });

const userStore = useUserStore();

const appAccess = computed(() => {
	if (!userStore.currentUser) return true;
	return userStore.currentUser?.app_access || false;
});

const cookies = useCookies(['license-banner-dismissed']);
const settingsStore = useSettingsStore();

const showLicenseBanner = computed(
	() => userStore.isAdmin && !settingsStore.settings?.project_owner && !cookies.get('license-banner-dismissed'),
);
</script>

<template>
	<PrivateViewNoAppAccess v-if="appAccess === false" />
	<PrivateViewRoot v-else v-bind="$props" :class="$attrs.class">
		<template #navigation><slot name="navigation" /></template>
		<template #actions:append><slot name="actions:append" /></template>
		<template #actions:prepend><slot name="actions:prepend" /></template>
		<template #actions><slot name="actions" /></template>
		<template #headline><slot name="headline" /></template>
		<template #title-outer:append><slot name="title-outer:append" /></template>
		<template #title-outer:prepend><slot name="title-outer:prepend" /></template>
		<template #title:append><slot name="title:append" /></template>
		<template #title:prepend><slot name="title:prepend" /></template>
		<template #title><slot name="title" /></template>
		<template #sidebar><slot name="sidebar" /></template>

		<slot />
	</PrivateViewRoot>

	<NotificationsDrawer />
	<NotificationDialogs />

	<LicenseBanner v-model="showLicenseBanner" />
</template>
