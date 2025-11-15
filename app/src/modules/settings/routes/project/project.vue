<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useCollection } from '@directus/composables';
import { clone } from 'lodash';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import ProjectInfoSidebarDetail from './components/project-info-sidebar-detail.vue';

const router = useRouter();

const settingsStore = useSettingsStore();
const serverStore = useServerStore();

const { fields: allFields } = useCollection('directus_settings');

const EXCLUDED_GROUPS: string[] = ['theming_group', 'ai_group'] as const;

const fields = computed(() => {
	return allFields.value.filter((field) => {
		if (field.meta?.group) {
			return EXCLUDED_GROUPS.includes(field.meta?.group) === false;
		}

		return EXCLUDED_GROUPS.includes(field.field) === false;
	});
});

const initialValues = ref(clone(settingsStore.settings));

const edits = ref<{ [key: string]: any } | null>(null);

const hasEdits = computed(() => edits.value !== null && Object.keys(edits.value).length > 0);

const saving = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function save() {
	if (edits.value === null) return;
	saving.value = true;
	await settingsStore.updateSettings(edits.value);
	await serverStore.hydrate({ isLanguageUpdated: 'default_language' in edits.value });
	edits.value = null;
	saving.value = false;
	initialValues.value = clone(settingsStore.settings);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<template>
	<private-view :title="$t('settings_project')" icon="tune">
		<template #headline><v-breadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #actions>
			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="!hasEdits" :loading="saving" small @click="save">
				<v-icon name="check" small />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="settings">
			<v-form v-model="edits" :initial-values="initialValues" :fields="fields" :primary-key="1" />
		</div>

		<template #sidebar>
			<project-info-sidebar-detail />
		</template>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<style lang="scss" scoped>
.settings {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.header-icon {
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}
</style>
