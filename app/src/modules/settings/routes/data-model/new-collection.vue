<script setup lang="ts">
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { DeepPartial, Field, Relation } from '@directus/types';
import { cloneDeep } from 'lodash';
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const defaultSystemFields = {
	status: {
		enabled: false,
		inputDisabled: false,
		name: 'status',
		label: 'status',
		icon: 'flag',
	},
	sort: {
		enabled: false,
		inputDisabled: false,
		name: 'sort',
		label: 'sort',
		icon: 'low_priority',
	},
	dateCreated: {
		enabled: false,
		inputDisabled: false,
		name: 'date_created',
		label: 'created_on',
		icon: 'access_time',
	},
	userCreated: {
		enabled: false,
		inputDisabled: false,
		name: 'user_created',
		label: 'created_by',
		icon: 'account_circle',
	},
	dateUpdated: {
		enabled: false,
		inputDisabled: false,
		name: 'date_updated',
		label: 'updated_on',
		icon: 'access_time',
	},
	userUpdated: {
		enabled: false,
		inputDisabled: false,
		name: 'user_updated',
		label: 'updated_by',
		icon: 'account_circle',
	},
};

const { t } = useI18n();

const router = useRouter();

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const isOpen = useDialogRoute();

const currentTab = ref(['collection_setup']);

const collectionName = ref<string | null>(null);
const singleton = ref(false);
const primaryKeyFieldName = ref('id');
const primaryKeyFieldType = ref<'auto_int' | 'auto_big_int' | 'uuid' | 'manual'>('auto_int');

const sortField = ref<string>();

const archiveField = ref<string>();
const archiveValue = ref<string>();
const unarchiveValue = ref<string>();

const systemFields = reactive(cloneDeep(defaultSystemFields));

const saving = ref(false);

watch(() => singleton.value, setOptionsForSingleton);

function setOptionsForSingleton() {
	systemFields.sort = { ...defaultSystemFields.sort };
	systemFields.sort.inputDisabled = singleton.value;
}

async function save() {
	saving.value = true;

	try {
		await api.post(`/collections`, {
			collection: collectionName.value,
			fields: [getPrimaryKeyField(), ...getSystemFields()],
			schema: {},
			meta: {
				sort_field: sortField.value,
				archive_field: archiveField.value,
				archive_value: archiveValue.value,
				unarchive_value: unarchiveValue.value,
				singleton: singleton.value,
			},
		});

		const storeHydrations: Promise<void>[] = [];

		const relations = getSystemRelations();

		if (relations.length > 0) {
			const requests = relations.map((relation) => api.post('/relations', relation));
			await Promise.all(requests);
			storeHydrations.push(relationsStore.hydrate());
		}

		storeHydrations.push(collectionsStore.hydrate(), fieldsStore.hydrate());
		await Promise.all(storeHydrations);

		notify({
			title: t('collection_created'),
		});

		router.replace(`/settings/data-model/${collectionName.value}`);
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

function getPrimaryKeyField() {
	if (primaryKeyFieldType.value === 'uuid') {
		return {
			field: primaryKeyFieldName.value,
			type: 'uuid',
			meta: {
				hidden: true,
				readonly: true,
				interface: 'input',
				special: ['uuid'],
			},
			schema: {
				is_primary_key: true,
				length: 36,
				has_auto_increment: false,
			},
		};
	} else if (primaryKeyFieldType.value === 'manual') {
		return {
			field: primaryKeyFieldName.value,
			type: 'string',
			meta: {
				interface: 'input',
				readonly: false,
				hidden: false,
			},
			schema: {
				is_primary_key: true,
				length: 255,
				has_auto_increment: false,
			},
		};
	} else {
		return {
			field: primaryKeyFieldName.value,
			type: primaryKeyFieldType.value === 'auto_big_int' ? 'bigInteger' : 'integer',
			meta: {
				hidden: true,
				interface: 'input',
				readonly: true,
			},
			schema: {
				is_primary_key: true,
				has_auto_increment: true,
			},
		};
	}
}

function getSystemFields() {
	const fields: DeepPartial<Field>[] = [];

	// Status
	if (systemFields.status.enabled === true) {
		fields.push({
			field: systemFields.status.name,
			type: 'string',
			meta: {
				width: 'full',
				options: {
					choices: [
						{
							text: '$t:published',
							value: 'published',
							color: 'var(--theme--primary)',
						},
						{
							text: '$t:draft',
							value: 'draft',
							color: 'var(--theme--foreground)',
						},
						{
							text: '$t:archived',
							value: 'archived',
							color: 'var(--theme--warning)',
						},
					],
				},
				interface: 'select-dropdown',
				display: 'labels',
				display_options: {
					showAsDot: true,
					choices: [
						{
							text: '$t:published',
							value: 'published',
							color: 'var(--theme--primary)',
							foreground: 'var(--theme--primary)',
							background: 'var(--theme--primary-background)',
						},
						{
							text: '$t:draft',
							value: 'draft',
							color: 'var(--theme--foreground)',
							foreground: 'var(--theme--foreground)',
							background: 'var(--theme--background-normal)',
						},
						{
							text: '$t:archived',
							value: 'archived',
							color: 'var(--theme--warning)',
							foreground: 'var(--theme--warning)',
							background: 'var(--theme--warning-background)',
						},
					],
				},
			},
			schema: {
				default_value: 'draft',
				is_nullable: false,
			},
		});

		archiveField.value = systemFields.status.name;
		archiveValue.value = 'archived';
		unarchiveValue.value = 'draft';
	}

	// Sort
	if (systemFields.sort.enabled === true) {
		fields.push({
			field: systemFields.sort.name,
			type: 'integer',
			meta: {
				interface: 'input',
				hidden: true,
			},
			schema: {},
		});

		sortField.value = systemFields.sort.name;
	}

	if (systemFields.userCreated.enabled === true) {
		fields.push({
			field: systemFields.userCreated.name,
			type: 'uuid',
			meta: {
				special: ['user-created'],
				interface: 'select-dropdown-m2o',
				options: {
					template: '{{avatar}} {{first_name}} {{last_name}}',
				},
				display: 'user',
				readonly: true,
				hidden: true,
				width: 'half',
			},
			schema: {},
		});
	}

	if (systemFields.dateCreated.enabled === true) {
		fields.push({
			field: systemFields.dateCreated.name,
			type: 'timestamp',
			meta: {
				special: ['date-created'],
				interface: 'datetime',
				readonly: true,
				hidden: true,
				width: 'half',
				display: 'datetime',
				display_options: {
					relative: true,
				},
			},
			schema: {},
		});
	}

	if (systemFields.userUpdated.enabled === true) {
		fields.push({
			field: systemFields.userUpdated.name,
			type: 'uuid',
			meta: {
				special: ['user-updated'],
				interface: 'select-dropdown-m2o',
				options: {
					template: '{{avatar}} {{first_name}} {{last_name}}',
				},
				display: 'user',
				readonly: true,
				hidden: true,
				width: 'half',
			},
			schema: {},
		});
	}

	if (systemFields.dateUpdated.enabled === true) {
		fields.push({
			field: systemFields.dateUpdated.name,
			type: 'timestamp',
			meta: {
				special: ['date-updated'],
				interface: 'datetime',
				readonly: true,
				hidden: true,
				width: 'half',
				display: 'datetime',
				display_options: {
					relative: true,
				},
			},
			schema: {},
		});
	}

	return fields;
}

function getSystemRelations() {
	const relations: Partial<Relation>[] = [];

	if (systemFields.userCreated.enabled === true) {
		relations.push({
			collection: collectionName.value!,
			field: systemFields.userCreated.name,
			related_collection: 'directus_users',
			schema: {},
		});
	}

	if (systemFields.userUpdated.enabled === true) {
		relations.push({
			collection: collectionName.value!,
			field: systemFields.userUpdated.name,
			related_collection: 'directus_users',
			schema: {},
		});
	}

	return relations;
}

function onApply() {
	if (currentTab.value[0] === 'optional_system_fields') {
		if (saving.value) return;
		save();
		return;
	}

	if (!collectionName.value?.length) return;

	currentTab.value = ['optional_system_fields'];
}
</script>

<template>
	<v-drawer
		:title="$t('creating_new_collection')"
		:model-value="isOpen"
		class="new-collection"
		persistent
		:sidebar-label="currentTab[0] && $t(currentTab[0])"
		@cancel="router.push('/settings/data-model')"
		@apply="onApply"
	>
		<template #sidebar>
			<v-tabs v-model="currentTab" vertical>
				<v-tab value="collection_setup">{{ $t('collection_setup') }}</v-tab>
				<v-tab value="optional_system_fields" :disabled="!collectionName">
					{{ $t('optional_system_fields') }}
				</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items v-model="currentTab" class="content">
			<v-tab-item value="collection_setup">
				<v-notice>{{ $t('creating_collection_info') }}</v-notice>

				<div class="grid">
					<div class="field half">
						<div class="type-label">
							{{ $t('name') }}
							<v-icon v-tooltip="$t('required')" class="required" name="star" sup filled />
						</div>
						<v-input
							v-model="collectionName"
							autofocus
							class="monospace"
							db-safe
							:placeholder="$t('a_unique_table_name')"
						/>
						<small class="type-note">{{ $t('collection_names_are_case_sensitive') }}</small>
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('singleton') }}</div>
						<v-checkbox v-model="singleton" block :label="$t('singleton_label')" />
					</div>
					<v-divider class="full" />
					<div class="field half">
						<div class="type-label">{{ $t('primary_key_field') }}</div>
						<v-input
							v-model="primaryKeyFieldName"
							class="monospace"
							db-safe
							:placeholder="$t('a_unique_column_name')"
						/>
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('type') }}</div>
						<v-select
							v-model="primaryKeyFieldType"
							:items="[
								{
									text: $t('auto_increment_integer'),
									value: 'auto_int',
								},
								{
									text: $t('auto_increment_big_integer'),
									value: 'auto_big_int',
								},
								{
									text: $t('generated_uuid'),
									value: 'uuid',
								},
								{
									text: $t('manual_string'),
									value: 'manual',
								},
							]"
						/>
					</div>
				</div>
			</v-tab-item>
			<v-tab-item value="optional_system_fields">
				<v-notice>{{ $t('creating_collection_system') }}</v-notice>

				<div class="grid system">
					<div
						v-for="(info, field, index) in systemFields"
						:key="field"
						class="field"
						:class="index % 2 === 0 ? 'half' : 'half-right'"
					>
						<div class="type-label">{{ $t(info.label) }}</div>
						<v-input
							v-model="info.name"
							db-safe
							class="monospace"
							:class="{ active: info.enabled }"
							:disabled="info.inputDisabled"
							@focus="info.enabled = true"
						>
							<template #prepend>
								<v-checkbox v-model="info.enabled" :disabled="info.inputDisabled" />
							</template>

							<template #append>
								<v-icon :name="info.icon" />
							</template>
						</v-input>
					</div>
				</div>
			</v-tab-item>
		</v-tabs-items>

		<template #actions>
			<v-button
				v-if="currentTab[0] === 'collection_setup'"
				v-tooltip.bottom="$t('next')"
				:disabled="!collectionName || collectionName.length === 0"
				icon
				rounded
				small
				@click="currentTab = ['optional_system_fields']"
			>
				<v-icon name="arrow_forward" small />
			</v-button>
			<v-button
				v-if="currentTab[0] === 'optional_system_fields'"
				v-tooltip.bottom="$t('finish_setup')"
				:loading="saving"
				icon
				rounded
				small
				@click="save"
			>
				<v-icon name="check" small />
			</v-button>
		</template>
	</v-drawer>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.type-title {
	margin-block-end: 48px;
}

.grid {
	@include mixins.form-grid;
}

.system :deep(.v-input .input) {
	color: var(--theme--foreground-subdued);
}

.system :deep(.v-input .active .input) {
	color: var(--theme--foreground);
}

.system .v-icon {
	--v-icon-color: var(--theme--foreground-subdued);
}

.spacer {
	flex-grow: 1;
}

.v-input.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.required {
	color: var(--theme--primary);
}

.content {
	padding: var(--content-padding);
	padding-block: 0 var(--content-padding);
}

.v-notice {
	margin-block-end: 36px;
}

.type-note {
	position: relative;
	display: block;
	max-inline-size: 520px;
	margin-block-start: 4px;
}
</style>
