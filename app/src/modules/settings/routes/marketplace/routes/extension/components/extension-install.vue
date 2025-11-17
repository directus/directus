<script setup lang="ts">
import { useExtensionsStore } from '@/stores/extensions';
import { useServerStore } from '@/stores/server';
import { unexpectedError } from '@/utils/unexpected-error';
import { computed, ref } from 'vue';

const props = defineProps<{ extensionId: string; versionId: string }>();

const extensionsStore = useExtensionsStore();
const serverStore = useServerStore();

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

const limit = computed(() => {
	const limit = serverStore.info.extensions?.limit;
	return limit ?? -1;
});

const atLimit = computed(() => {
	if (limit.value === -1) return false;
	const installedNumber = extensionsStore.extensions.length;
	return installedNumber >= limit.value;
});
</script>

<template>
	<v-button v-if="installed" class="install" align="left" full-width to="/settings/extensions">
		<v-icon name="settings" left />
		{{ $t('manage') }}
	</v-button>

	<v-button
		v-else
		v-tooltip="atLimit ? $t('reached_maximum_number_of_extensions', { n: limit }) : null"
		:loading="installing"
		:disabled="atLimit"
		class="install"
		align="left"
		full-width
		@click="install"
	>
		<v-icon name="download" left />
		{{ $t('install_extension') }}
	</v-button>
</template>

<style scoped>
.install {
	--v-button-padding: 0 10px;
}
</style>
