<template>
	<private-view :title="t('settings_project')">
		<template #headline>{{ t('settings') }}</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="public" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="noEdits" :loading="saving" @click="save">
				<v-icon name="check" />
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

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';
import { useCollection } from '@directus/shared/composables';
import { useSettingsStore, useServerStore } from '@/stores';
import ProjectInfoSidebarDetail from './components/project-info-sidebar-detail.vue';
import { clone } from 'lodash';
import unsavedChanges from '@/composables/unsaved-changes';
import { useRouter, onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';

export default defineComponent({
	components: { SettingsNavigation, ProjectInfoSidebarDetail },
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const settingsStore = useSettingsStore();
		const serverStore = useServerStore();

		const { fields } = useCollection('directus_settings');

		const initialValues = ref(clone(settingsStore.settings));

		const edits = ref<{ [key: string]: any } | null>(null);

		const noEdits = computed<boolean>(() => edits.value === null || Object.keys(edits.value).length === 0);

		const saving = ref(false);

		const isSavable = computed(() => {
			if (noEdits.value === true) return false;
			return noEdits.value;
		});

		unsavedChanges(isSavable);

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		const editsGuard: NavigationGuard = (to) => {
			if (!noEdits.value) {
				confirmLeave.value = true;
				leaveTo.value = to.fullPath;
				return false;
			}
		};
		onBeforeRouteUpdate(editsGuard);
		onBeforeRouteLeave(editsGuard);

		return {
			t,
			fields,
			initialValues,
			edits,
			noEdits,
			saving,
			isSavable,
			confirmLeave,
			leaveTo,
			save,
			discardAndLeave,
		};

		async function save() {
			if (edits.value === null) return;
			saving.value = true;
			await settingsStore.updateSettings(edits.value);
			await serverStore.hydrate();
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
	},
});
</script>

<style lang="scss" scoped>
.settings {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-10);
}
</style>
