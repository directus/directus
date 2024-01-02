<script setup lang="ts">
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion, Field } from '@directus/types';
import { isNil } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VersionPromoteField from './version-promote-field.vue';

type Comparison = {
	outdated: boolean;
	mainHash: string;
	current: Record<string, any>;
	main: Record<string, any>;
};

interface Props {
	active: boolean;
	currentVersion: ContentVersion;
	deleteVersionsAllowed: boolean;
}

const { t } = useI18n();

const fieldsStore = useFieldsStore();

const props = defineProps<Props>();

const { active, currentVersion, deleteVersionsAllowed } = toRefs(props);

const selectedFields = ref<string[]>([]);

const comparedData = ref<Comparison | null>(null);

const loading = ref(false);

const { tabs, currentTab } = useTab();

const { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote } = usePromoteDialog();

const emit = defineEmits<{
	cancel: [];
	promote: [deleteOnPromote: boolean];
}>();

const currentVersionDisplayName = computed(() =>
	isNil(currentVersion.value.name) ? currentVersion.value.key : currentVersion.value.name,
);

const isOutdated = computed(() => comparedData.value?.outdated ?? false);

const mainHash = computed(() => comparedData.value?.mainHash ?? '');

const comparedFields = computed<Field[]>(() => {
	if (comparedData.value === null) return [];

	return Object.keys(comparedData.value.current)
		.map((fieldKey) => fieldsStore.getField(unref(currentVersion).collection, fieldKey))
		.filter((field) => !!field && !isPrimaryKey(field)) as Field[];

	function isPrimaryKey(field: Field) {
		return (
			field.schema?.is_primary_key === true &&
			(field.schema?.has_auto_increment === true || field.meta?.special?.includes('uuid'))
		);
	}
});

const previewData = computed(() => {
	if (!comparedData.value) return null;

	const data: Record<string, any> = {};

	for (const fieldKey of Object.keys(comparedData.value.main)) {
		data[fieldKey] = selectedFields.value.includes(fieldKey)
			? comparedData.value.current[fieldKey]
			: comparedData.value.main[fieldKey];
	}

	return data;
});

watch(
	active,
	(value) => {
		if (value) getComparison();
	},
	{ immediate: true },
);

function addField(field: string) {
	selectedFields.value = [...selectedFields.value, field];
}

function removeField(field: string) {
	selectedFields.value = selectedFields.value.filter((f) => f !== field);
}

async function getComparison() {
	loading.value = true;

	try {
		const result: Comparison = await api
			.get(`/versions/${unref(currentVersion).id}/compare`)
			.then((res) => res.data.data);

		comparedData.value = result;

		const comparedFieldsKeys = comparedFields.value.map((field) => field.field);

		selectedFields.value = Object.keys(result.current).filter((fieldKey) => comparedFieldsKeys.includes(fieldKey));
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function usePromoteDialog() {
	const confirmDeleteOnPromoteDialogActive = ref(false);
	const promoting = ref(false);

	return { confirmDeleteOnPromoteDialogActive, onPromoteClick, promoting, promote };

	function onPromoteClick() {
		if (deleteVersionsAllowed.value) {
			confirmDeleteOnPromoteDialogActive.value = true;
		} else {
			promote(false);
		}
	}

	async function promote(deleteOnPromote: boolean) {
		promoting.value = true;

		try {
			await api.post(
				`/versions/${unref(currentVersion).id}/promote`,
				unref(selectedFields).length > 0
					? { mainHash: unref(mainHash), fields: unref(selectedFields) }
					: { mainHash: unref(mainHash) },
			);

			confirmDeleteOnPromoteDialogActive.value = false;

			emit('promote', deleteOnPromote);
		} catch (error) {
			unexpectedError(error);
		} finally {
			promoting.value = false;
		}
	}
}

function useTab() {
	const tabs = [
		{
			text: t('promote_version_changes'),
			value: 'changes',
		},
		{
			text: t('promote_version_preview'),
			value: 'preview',
		},
	];

	const currentTab = ref([tabs[0]!.value]);

	return { tabs, currentTab };
}
</script>

<template>
	<v-drawer
		:title="t('promote_version_drawer_title', { version: currentVersionDisplayName })"
		class="version-drawer"
		persistent
		:model-value="active"
		@cancel="$emit('cancel')"
		@esc="$emit('cancel')"
	>
		<template #sidebar>
			<v-tabs v-model="currentTab" vertical>
				<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
					{{ tab.text }}
				</v-tab>
			</v-tabs>
		</template>

		<div class="content">
			<div v-if="currentTab[0] === 'changes'" class="grid">
				<v-notice v-if="isOutdated" type="warning" class="field full">
					{{ t('outdated_notice') }}
				</v-notice>
				<v-notice v-else class="field full">
					{{ t('promote_notice') }}
				</v-notice>
				<div v-for="field in comparedFields" :key="field.field" class="field full">
					<div class="type-label">
						{{ field.name }}
					</div>
					<div
						class="compare main"
						:class="{ active: !selectedFields.includes(field.field) }"
						@click="removeField(field.field)"
					>
						<v-icon name="looks_one" />
						<version-promote-field class="field-content" :value="comparedData?.main[field.field]" />
						<v-chip class="version" x-small>{{ t('main_version') }}</v-chip>
						<v-icon :name="!selectedFields.includes(field.field) ? 'check' : 'close'" />
					</div>
					<div
						class="compare current"
						:class="{ active: selectedFields.includes(field.field) }"
						@click="addField(field.field)"
					>
						<v-icon name="looks_two" />
						<version-promote-field class="field-content" :value="comparedData?.current[field.field]" />
						<v-chip class="version" x-small>{{ currentVersionDisplayName }}</v-chip>
						<v-icon :name="selectedFields.includes(field.field) ? 'check' : 'close'" />
					</div>
				</div>
			</div>
			<div v-if="currentTab[0] === 'preview'">
				<v-form
					disabled
					:collection="currentVersion.collection"
					:primary-key="currentVersion.item"
					:initial-values="previewData"
				/>
			</div>
		</div>

		<v-dialog v-model="confirmDeleteOnPromoteDialogActive" @esc="confirmDeleteOnPromoteDialogActive = false">
			<v-card>
				<v-card-title>
					{{ t('delete_on_promote_copy', { version: currentVersionDisplayName }) }}
				</v-card-title>
				<v-card-actions>
					<v-button secondary @click="promote(false)">{{ t('keep') }}</v-button>
					<v-button :loading="promoting" kind="danger" @click="promote(true)">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #actions>
			<v-button
				v-tooltip.bottom="selectedFields.length === 0 ? t('promote_version_disabled') : t('promote_version')"
				:disabled="selectedFields.length === 0"
				icon
				rounded
				:loading="promoting"
				@click="onPromoteClick"
			>
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);

	.grid {
		@include form-grid;
	}
}

.compare {
	display: flex;
	align-items: center;
	width: 100%;
	padding: 8px;
	gap: 8px;
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--background-subdued);
	cursor: pointer;

	.field-content {
		flex-grow: 1;
	}

	.version {
		text-transform: uppercase;
	}

	&.main {
		border-radius: var(--theme--border-radius) var(--theme--border-radius) 0 0;
		&.active {
			color: var(--theme--secondary);
			background-color: var(--secondary-alt);

			.version {
				color: var(--theme--secondary);
				border-color: var(--theme--secondary);
				background-color: var(--secondary-25);
			}
		}
	}

	&.current {
		border-radius: 0 0 var(--theme--border-radius) var(--theme--border-radius);
		&.active {
			color: var(--theme--primary);
			background-color: var(--theme--primary-background);

			.version {
				color: var(--theme--primary);
				border-color: var(--theme--primary);
				background-color: var(--theme--primary-subdued);
			}
		}
	}
}
</style>
