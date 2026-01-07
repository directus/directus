<script setup lang="ts">
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { useCollection } from '@directus/composables';
import { clone } from 'lodash';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

const router = useRouter();

const settingsStore = useSettingsStore();
const serverStore = useServerStore();

const { fields: allFields } = useCollection('directus_settings');

const EXCLUDED_GROUPS: string[] = ['theming_group', 'ai_group', 'mcp_group'];

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
	<PrivateView :title="$t('settings_project')" icon="tune">
		<template #headline><VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:disabled="!hasEdits"
				:loading="saving"
				icon="check"
				@click="save"
			/>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="settings">
			<VForm v-model="edits" :initial-values="initialValues" :fields="fields" :primary-key="1" />
		</div>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
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
