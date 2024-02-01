<script setup lang="ts">
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	extensionId: string;
}>();

const isOpen = useDialogRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const error = ref<unknown>(null);
const extension = ref<RegistryDescribeResponse>();

watchEffect(async () => {
	if (!props.extensionId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/registry/${props.extensionId}`);
		extension.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});

const close = () => {
	router.push('/settings/marketplace');
};
</script>

<template>
	<v-drawer :model-value="isOpen" :title="extension?.name ?? t('loading')" @cancel="close">
		<div class="drawer-item-content">
			<template v-if="extension">
				<div v-md="extension.readme" />
			</template>

			<v-progress-circular v-else-if="loading" indeterminate />

			<v-error v-else :error="error" />
		</div>
	</v-drawer>
</template>

<style scoped lang="scss">
.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
