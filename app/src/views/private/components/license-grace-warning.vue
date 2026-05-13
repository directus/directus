<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import LicenseResolutionDialog from '@/modules/settings/routes/license/components/license-resolution-dialog.vue';
import { useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const licenseStore = useLicenseStore();
const { info, pendingResolution } = storeToRefs(licenseStore);
const cookies = useCookies(['license-resolution-acknowledged']);

// On every login admins with usage over their plan limits get a dismissible warning
// modal until grace ends or they fix it. Closing is handled by the dialog itself —
// "Remind Me Later" writes the cookie, which flips this computed to false.
const open = computed({
	get: () =>
		userStore.isAdmin &&
		info.value?.status === 'grace' &&
		(pendingResolution.value?.length ?? 0) > 0 &&
		!cookies.get('license-resolution-acknowledged'),
	set: () => {
		// no-op — see comment above
	},
});

// Lazily hydrate pendingResolution when an admin lands in the grace state, so the
// modal has the violation list to render. Skips if already loaded or non-admin.
watch(
	() => info.value?.status,
	(status) => {
		if (status === 'grace' && userStore.isAdmin && pendingResolution.value === null) {
			licenseStore.hydratePendingResolution();
		}
	},
	{ immediate: true },
);
</script>

<template>
	<LicenseResolutionDialog v-model="open" />
</template>
