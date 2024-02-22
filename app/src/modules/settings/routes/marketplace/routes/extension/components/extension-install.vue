<script setup lang="ts">
import { useExtensionsStore } from '@/stores/extensions';
import { unexpectedError } from '@/utils/unexpected-error';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{ extensionId: string; versionId: string }>();

const extensionsStore = useExtensionsStore();

const installed = computed(() => {
	return extensionsStore.extensionIds.includes(props.extensionId);
});

const installing = ref(false);

const install = async () => {
	if (installing.value) return;

	installing.value = true;

	try {
		await extensionsStore.install(props.extensionId, props.versionId);
	} catch (err) {
		unexpectedError(err);
	}

	installing.value = false;
};
</script>

<template>
	<v-button v-if="installed" class="install" align="left" full-width to="/settings/extensions" secondary>
		<v-icon name="settings" left />
		{{ t('manage') }}
	</v-button>

	<v-button v-else :loading="installing" class="install" align="left" full-width @click="install">
		<v-icon name="download" left />
		{{ t('install_extension') }}
	</v-button>
</template>

<style scoped>
.install {
	--v-button-padding: 0 10px;
}
</style>
