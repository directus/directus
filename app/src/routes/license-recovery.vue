<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import LicenseResolutionDialog from '@/modules/settings/routes/license/components/license-resolution-dialog.vue';
import { useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const licenseStore = useLicenseStore();
const userStore = useUserStore();
const { isLocked } = storeToRefs(licenseStore);

useHead({ title: 'License recovery' });

const open = ref(true);

function bounceOut() {
	const currentUser = userStore.currentUser;
	const lastPage = currentUser && 'last_page' in currentUser ? currentUser.last_page : null;
	// Avoid bouncing back to ourselves if `last_page` was set while the user was here.
	const target = lastPage && lastPage !== '/license-recovery' ? lastPage : '/content';
	router.replace(target);
}

onMounted(async () => {
	if (!userStore.isAdmin || !isLocked.value) {
		bounceOut();
		return;
	}

	await licenseStore.hydratePendingResolution();

	// Defensive fallback: an empty resolution means the lock state is stale
	// (e.g. backend just degraded silently to Core). Re-hydrate to pick up the
	// fresh status, then bounce out if the lock has lifted.
	if ((licenseStore.pendingResolution?.length ?? 0) === 0) {
		await licenseStore.hydrate();
		if (!isLocked.value) bounceOut();
	}
});

watch(isLocked, (locked) => {
	if (!locked) bounceOut();
});
</script>

<template>
	<div class="license-recovery">
		<LicenseResolutionDialog v-model="open" @update:model-value="$event === false && bounceOut()" />
	</div>
</template>

<style scoped>
.license-recovery {
	min-block-size: 100vh;
	background-color: var(--theme--background);
}
</style>
