<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import LicenseResolutionDialog from '@/modules/settings/routes/license/components/license-resolution-dialog.vue';
import { useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const licenseStore = useLicenseStore();
const { info, pendingResolution, wasDowngraded, isLocked, isCoreGrace } = storeToRefs(licenseStore);

const cookies = useCookies(['license-resolution-acknowledged']);

// Mirrors the key written by LicenseResolutionDialog
const acknowledgeKey = computed(() => {
	const name = info.value?.name ?? '';
	const boundary = info.value?.expires_at ?? info.value?.renews_at ?? '';
	return `${name}:${boundary}`;
});

const acknowledged = ref<string | null>(cookies.get('license-resolution-acknowledged') ?? null);

const isGracePrompt = computed(
	() => info.value?.status === 'grace' && !isCoreGrace.value && (pendingResolution.value?.length ?? 0) > 0,
);

// Downgrade acknowledgement clears server-side after resolve()
const isDowngradePrompt = computed(() => wasDowngraded.value && !isLocked.value);

const open = computed({
	get: () => {
		if (!userStore.isAdmin) return false;
		if (isDowngradePrompt.value) return true;
		if (isGracePrompt.value) return acknowledged.value !== acknowledgeKey.value;
		return false;
	},
	set: (value) => {
		if (value === false && isGracePrompt.value) acknowledged.value = acknowledgeKey.value;
	},
});

// Clear the grace acknowledgement when grace ends so a future grace event re-prompts.
// Without this, a Core license (constant expires_at: -1) acknowledged once would stay
// dismissed forever across repeated violations, since acknowledgeKey would never change.
watch(
	() => info.value?.status,
	(newStatus, oldStatus) => {
		if (oldStatus === 'grace' && newStatus !== 'grace') {
			cookies.remove('license-resolution-acknowledged', { path: '/' });
			acknowledged.value = null;
		}
	},
);

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
