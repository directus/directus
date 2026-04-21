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
import LicenseGracePopup from '../../components/license-grace-popup.vue';
import NotificationDialogs from '../../components/notification-dialogs.vue';
import NotificationsDrawer from '../../components/notifications-drawer.vue';
import PrivateViewNoAppAccess from './private-view-no-app-access.vue';
import PrivateViewRoot from './private-view-root.vue';
import { LICENSE_BANNER_DISMISSED_COOKIE, ONBOARDING_GRACE_POPUP_SKIPPED_COOKIE } from '@/modules/licensing/constants';
import { LICENSING_SESSION_COOKIES } from '@/modules/licensing/cookies';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';

defineProps<PrivateViewProps>();
defineOptions({ inheritAttrs: false });

const userStore = useUserStore();
const serverStore = useServerStore();

const appAccess = computed(() => {
	if (!userStore.currentUser) return true;
	return userStore.currentUser?.app_access || false;
});

const cookies = useCookies(LICENSING_SESSION_COOKIES);
const settingsStore = useSettingsStore();

const showOwnerPopup = computed(
	() => userStore.isAdmin && !settingsStore.settings?.project_owner && !cookies.get(LICENSE_BANNER_DISMISSED_COOKIE),
);

const showGracePopup = computed(
	() =>
		userStore.isAdmin &&
		serverStore.info.setupCompleted === true &&
		serverStore.info.license_status === 'grace' &&
		serverStore.info.license_grace_type === 'onboarding' &&
		serverStore.info.show_license_key_field === true &&
		!cookies.get(ONBOARDING_GRACE_POPUP_SKIPPED_COOKIE),
);

const activePopup = computed<'grace' | 'owner' | null>(() => {
	if (showOwnerPopup.value) return 'owner';
	if (showGracePopup.value) return 'grace';
	return null;
});
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

	<LicenseBanner v-if="activePopup === 'owner'" />
	<LicenseGracePopup v-else-if="activePopup === 'grace'" />
</template>
