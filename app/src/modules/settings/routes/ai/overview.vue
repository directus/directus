<script setup lang="ts">
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { useCollection } from '@directus/composables';
import { clone } from 'lodash';
import { computed, ref, unref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

const router = useRouter();

const settingsStore = useSettingsStore();
const serverStore = useServerStore();

const { fields: allFields } = useCollection('directus_settings');

const aiFields = computed(() =>
	unref(allFields).filter((field) => field.meta?.group === 'ai_group' || field.field === 'ai_group'),
);

const mcpFields = computed(() =>
	unref(allFields).filter((field) => field.meta?.group === 'mcp_group' || field.field === 'mcp_group'),
);

const initialValues = ref(clone(settingsStore.settings));

const aiEdits = ref<Record<string, any> | null>(null);
const mcpEdits = ref<Record<string, any> | null>(null);

const hasEdits = computed(
	() =>
		(aiEdits.value !== null && Object.keys(aiEdits.value).length > 0) ||
		(mcpEdits.value !== null && Object.keys(mcpEdits.value).length > 0),
);

const saving = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function save() {
	const combinedEdits = { ...aiEdits.value, ...mcpEdits.value };
	if (Object.keys(combinedEdits).length === 0) return;
	saving.value = true;
	await settingsStore.updateSettings(combinedEdits);
	await serverStore.hydrate();
	aiEdits.value = null;
	mcpEdits.value = null;
	saving.value = false;
	initialValues.value = clone(settingsStore.settings);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	aiEdits.value = null;
	mcpEdits.value = null;
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<template>
	<PrivateView :title="$t('settings_ai')" icon="smart_toy">
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
			<VNotice v-if="!serverStore.info.ai_enabled" type="warning" class="disabled-notice">
				{{ $t('ai_disabled_by_env') }}
			</VNotice>
			<VForm
				v-model="aiEdits"
				:initial-values="initialValues"
				:fields="aiFields"
				:primary-key="1"
				:disabled="!serverStore.info.ai_enabled"
			/>

			<div class="mcp-section">
				<VNotice v-if="!serverStore.info.mcp_enabled" type="warning" class="disabled-notice">
					{{ $t('mcp_disabled_by_env') }}
				</VNotice>
				<VForm
					v-model="mcpEdits"
					:initial-values="initialValues"
					:fields="mcpFields"
					:primary-key="1"
					:disabled="!serverStore.info.mcp_enabled"
				/>
			</div>
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

.disabled-notice {
	margin-block-end: var(--theme--form--row-gap);
}

.mcp-section {
	margin-block-start: var(--theme--form--row-gap);
}
</style>
