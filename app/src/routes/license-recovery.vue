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

onMounted(async () => {
	if (!userStore.isAdmin || !isLocked.value) {
		router.replace('/');
		return;
	}

	await licenseStore.hydratePendingResolution();
});

// Once the lock is lifted (resolution succeeded), bounce back to the app.
watch(isLocked, (locked) => {
	if (!locked) router.replace('/');
});
</script>

<template>
	<div class="license-recovery">
		<LicenseResolutionDialog v-model="open" />
	</div>
</template>

<style scoped>
.license-recovery {
	min-block-size: 100vh;
	background-color: var(--theme--background);
}
</style>
