<template>
	<private-view :title="t('extensions')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon>
				<v-icon name="bolt" />
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
				@click="saveExtensions"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<v-info v-if="extensions.length === 0" icon="bolt" :title="t('no_flows')" center>
			{{ t('no_extensions_copy') }}
		</v-info>

        <v-list>
            <v-list-item boxed v-for="extension in extensions" :key="extension.name">
                {{ extension.name }}
                <v-checkbox :model-value="extension.enabled" @update:model-value="setEnabled(extension.name, $event)" />
            </v-list-item>
        </v-list>

		<router-view name="add" />
	</private-view>
</template>

<script lang="ts" setup>
import api from '@/api';
import { useExtensionsStore } from '@/stores/extensions';
import { ExtensionInfo } from '@directus/shared/types';
import { isEqual } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';

const { t } = useI18n();

const extensionsStore = useExtensionsStore();

const edits = ref<Record<string, ExtensionInfo>>({});
const extensions = computed(() => {
    return extensionsStore.extensions.map(extension => {
        if (edits.value[extension.name]) {
            return {
                ...extension,
                ...edits.value[extension.name]
            };
        }

        return extension;
    });
})

function setEnabled(name: string, enabled: boolean) {
    edits.value[name] = {
        ...edits.value[name],
        name,
        enabled,
    }
}

const hasEdits = computed(() => isEqual(extensions.value, extensionsStore.extensions) === false)

const saving = ref(false);

async function saveExtensions() {
    if (saving.value) return;

    saving.value = true;
    await api.patch('/extensions', Object.values(edits.value))
    await extensionsStore.hydrate()

    edits.value = {};
    saving.value = false;
}

</script>

<style scoped>
.v-table {
	padding: var(--content-padding);
	padding-top: 0;
}

.ctx-toggle {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--foreground-normal);
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
}
</style>
