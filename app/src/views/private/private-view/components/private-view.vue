<script lang="ts">
export interface PrivateViewProps {
	/** Title to show in the header bar. Can be overriden through the #title slot */
	title?: string;

	/** Render an icon before the title */
	icon?: string;

	/** What color to render the icon in */
	iconColor?: string;

	/** Render a back button in place of the title prepend icon */
	showBack?: boolean;

	/** Where to navigate to on back button click. Required when `showBack` is true */
	backTo?: string;
}
</script>

<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed } from 'vue';
import LicenseLoginModal from '../../components/license/license-login-modal.vue';
import LicenseBanner from '../../components/license-banner.vue';
import LicenseOnboarding from '../../components/license-onboarding.vue';
import LicenseResolutionPrompt from '../../components/license-resolution-prompt.vue';
import NotificationDialogs from '../../components/notification-dialogs.vue';
import NotificationsDrawer from '../../components/notifications-drawer.vue';
import PrivateViewNoAppAccess from './private-view-no-app-access.vue';
import PrivateViewRoot from './private-view-root.vue';
import { useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';

defineSlots<{
	navigation(): any;
	'title-outer:prepend'(): any;
	'title-outer:append'(): any;
	'title:prepend'(): any;
	'title:append'(): any;
	title(): any;
	'actions:prepend'(): any;
	actions(): any;
	'actions:primary'(): any;
	sidebar(): any;
	default(): any;
	/** @deprecated The `headline` slot is deprecated. Headline content now renders prepended to the title. */
	headline(): any;
	/** @deprecated Use `actions:primary` for primary CTAs, or the default `actions` slot for secondary actions. */
	'actions:append'(): any;
}>();

defineProps<PrivateViewProps>();
defineOptions({ inheritAttrs: false });

const userStore = useUserStore();

const appAccess = computed(() => {
	if (!userStore.currentUser) return true;
	return userStore.currentUser?.app_access || false;
});

const cookies = useCookies([
	'license-banner-dismissed',
	'license-onboarding-dismissed',
	'license-login-modal-dismissed',
]);

const serverStore = useServerStore();
const settingsStore = useSettingsStore();
const licenseStore = useLicenseStore();

const showLicenseBanner = computed({
	get: () =>
		userStore.isAdmin &&
		!settingsStore.settings?.project_owner &&
		!showLicenseOnboarding.value &&
		!licenseStore.isCoreGrace &&
		!cookies.get('license-banner-dismissed'),
	set: () => {
		// close is handled by cookie and hydrate inside the modal
	},
});

const showLicenseOnboarding = computed({
	get: () =>
		userStore.isAdmin &&
		serverStore.info.setupCompleted &&
		!serverStore.info.license?.source &&
		!settingsStore.settings?.project_usage &&
		!licenseStore.isCoreGrace &&
		!cookies.get('license-onboarding-dismissed'),
	set: () => {
		// close is handled by cookie and hydrate inside the modal
	},
});

const showLicenseLoginModal = computed({
	get: () =>
		userStore.isAdmin &&
		licenseStore.isCoreGrace &&
		!showLicenseOnboarding.value &&
		!cookies.get('license-login-modal-dismissed'),
	set: () => {
		// close is handled by cookie inside the modal
	},
});
</script>

<template>
	<PrivateViewNoAppAccess v-if="appAccess === false" />
	<PrivateViewRoot v-else v-bind="$props" :class="$attrs.class">
		<template #navigation><slot name="navigation" /></template>
		<template #actions:prepend><slot name="actions:prepend" /></template>
		<template #actions>
			<slot name="actions" />
			<slot name="actions:append" />
		</template>
		<template #actions:primary><slot name="actions:primary" /></template>
		<template #title-outer:append><slot name="title-outer:append" /></template>
		<template #title-outer:prepend><slot name="title-outer:prepend" /></template>
		<template #title:append><slot name="title:append" /></template>
		<template #title:prepend>
			<slot name="headline" />
			<slot name="title:prepend" />
		</template>
		<template #title><slot name="title" /></template>
		<template #sidebar><slot name="sidebar" /></template>

		<slot />
	</PrivateViewRoot>

	<NotificationsDrawer />
	<NotificationDialogs />

	<LicenseBanner v-model="showLicenseBanner" />
	<LicenseOnboarding v-model="showLicenseOnboarding" />
	<LicenseLoginModal v-model="showLicenseLoginModal" />
	<LicenseResolutionPrompt />
</template>
