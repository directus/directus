<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
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
	<VButton v-if="installed" class="install" align="left" full-width to="/settings/extensions">
		<VIcon name="settings" left />
		{{ $t('manage') }}
	</VButton>

	<VButton
		v-else
		v-tooltip="atLimit ? $t('reached_maximum_number_of_extensions', { n: limit }) : null"
		:loading="installing"
		:disabled="atLimit"
		class="install"
		align="left"
		full-width
		@click="install"
	>
		<VIcon name="download" left />
		{{ $t('install_extension') }}
	</VButton>
</template>

<style scoped>
.install {
	--v-button-padding: 0 10px;
}
</style>
