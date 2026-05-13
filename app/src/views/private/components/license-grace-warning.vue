<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import LicenseResolutionDialog from '@/modules/settings/routes/license/components/license-resolution-dialog.vue';
import { useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const licenseStore = useLicenseStore();
const { info, pendingResolution } = storeToRefs(licenseStore);

const open = computed({
	get: () => userStore.isAdmin && info.value?.status === 'grace' && (pendingResolution.value?.length ?? 0) > 0,
	set: () => {
		// no-op — modal is non-dismissible
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
