<template>
	<private-view :title="t('extensions')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon>
				<v-icon name="extension" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #actions>
			<v-button
				v-tooltip.bottom="t('save')"
				rounded
				icon
				:disabled="hasEdits === false"
				:loading="saving"
				@click="saveExtensions"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_extensions')" class="page-description" />
			</sidebar-detail>
		</template>

		<v-info v-if="extensions.length === 0" icon="extension" :title="t('no_extensions')" center>
			{{ t('no_extensions_copy') }}
		</v-info>

		<v-list>
			<v-list-item v-for="extension in extensions" :key="extension.name" block>
				<v-button disabled icon rounded><v-icon :name="extension.icon ?? 'extension'" /></v-button>
				{{ formatName(extension.name) }}
				<span v-if="extension.description" class="description">{{ extension.description }}</span>
				<span class="spacer"></span>
				<v-checkbox
					v-tooltip="extension.enabled ? t('disable_extension') : t('enable_extension')"
					:model-value="extension.enabled"
					@update:model-value="setEnabled(extension.name, $event)"
				/>
			</v-list-item>
		</v-list>

		<router-view name="add" />
	</private-view>
</template>

<script lang="ts" setup>
import api from '@/api';
import { useExtensionsStore } from '@/stores/extensions';
import formatTitle from '@directus/format-title';
import { ExtensionInfo } from '@directus/types';
import { isEqual } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';

const { t } = useI18n();

const extensionsStore = useExtensionsStore();

const edits = ref<Record<string, ExtensionInfo>>({});

const extensions = computed(() => {
	return extensionsStore.extensions.map((extension) => {
		if (edits.value[extension.name]) {
			return {
				...extension,
				...edits.value[extension.name],
			};
		}

		return extension;
	});
});

function setEnabled(name: string, enabled: boolean) {
	edits.value[name] = {
		...edits.value[name],
		name,
		enabled,
	};
}

function formatName(name: string) {
	return formatTitle(name.replace(/^directus-extension-/, ''));
}

const hasEdits = computed(() => isEqual(extensions.value, extensionsStore.extensions) === false);

const saving = ref(false);

async function saveExtensions() {
	if (saving.value) return;

	saving.value = true;
	await api.patch('/extensions', Object.values(edits.value));
	await extensionsStore.hydrate();
	edits.value = {};
	saving.value = false;
}
</script>

<style scoped>
main .v-list {
	padding: var(--content-padding);
	padding-top: 0;
}

.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
}

.v-list-item {
	display: flex;
	gap: 8px;
}

.spacer {
	flex-grow: 1;
}

.description {
	color: var(--foreground-subdued);
}
</style>
