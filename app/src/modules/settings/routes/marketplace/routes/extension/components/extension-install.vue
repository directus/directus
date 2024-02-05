<script setup lang="ts">
import { useExtensionsStore } from '@/stores/extensions';
import { unexpectedError } from '@/utils/unexpected-error';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

const { t } = useI18n();

const props = defineProps<{ versionId: string }>();

const extensionsStore = useExtensionsStore();

const installed = computed(() => {
	return extensionsStore.extensions.some(
		(ext) => ext.meta.source === 'registry' && ext.meta.folder === props.versionId,
	);
});

const installing = ref(false);

const install = async () => {
	if (installing.value) return;

	installing.value = true;

	try {
		// await extensionsStore.install(props.versionId);
	} catch (err) {
		unexpectedError(err);
	}

	installing.value = false;
};
</script>

<template>
	<MetadataItem v-if="installed" icon="check" color="primary">
		{{ t('installed') }}
	</MetadataItem>

	<v-list-item v-else class="install-button" block :class="{ installing }" clickable @click="install">
		<v-progress-circular v-if="installing" class="spinner" indeterminate></v-progress-circular>

		<template v-else>
			<v-list-item-icon>
				<slot name="icon"><v-icon name="download" /></slot>
			</v-list-item-icon>
			<v-list-item-content>{{ t('install_extension') }}</v-list-item-content>
		</template>
	</v-list-item>
</template>

<style scoped>
.install-button {
	--v-list-item-background-color: var(--theme--primary);
	--v-list-item-border-color: var(--theme--primary);
	--v-list-item-background-color-hover: var(--theme--primary-accent);
	--v-list-item-border-color-hover: var(--theme--primary-accent);
	--v-list-item-color: var(--foreground-inverted);
	--v-list-item-icon-color: var(--foreground-inverted);

	&.installing {
		--v-list-item-background-color-hover: var(--theme--primary);
		--v-list-item-border-color-hover: var(--theme--primary);

		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.spinner {
	--v-progress-circular-color: var(--foreground-inverted);
	--v-progress-circular-background-color: transparent;
	position: absolute;
}
</style>
