<template>
	<v-drawer
		:title="$t('creating_new_collection')"
		:active="true"
		class="new-collection"
		persistent
		@cancel="$router.push('/settings/data-model')"
		:sidebar-label="$t(currentTab)"
	>
		<template #sidebar>
			<v-tabs vertical v-model="currentTab">
				<v-tab value="collection_setup">{{ $t('collection_setup') }}</v-tab>
				<v-tab value="optional_system_fields" :disabled="!collectionName">
					{{ $t('optional_system_fields') }}
				</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items class="content" v-model="currentTab">
			<v-tab-item value="collection_setup">
				<v-notice type="info">{{ $t('creating_collection_info') }}</v-notice>

				<div class="grid">
					<div class="field half">
						<div class="type-label">
							{{ $t('name') }}
							<v-icon class="required" v-tooltip="$t('required')" name="star" sup />
						</div>
						<v-input
							autofocus
							class="monospace"
							v-model="collectionName"
							db-safe
							:placeholder="$t('a_unique_table_name')"
						/>
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('singleton') }}</div>
						<v-checkbox block :label="$t('singleton_label')" v-model="singleton" />
					</div>
					<v-divider class="full" />
					<div class="field half">
						<div class="type-label">{{ $t('primary_key_field') }}</div>
						<v-input
							class="monospace"
							v-model="primaryKeyFieldName"
							db-safe
							:placeholder="$t('a_unique_column_name')"
						/>
					</div>
					<div class="field half">
						<div class="type-label">{{ $t('type') }}</div>
						<v-select
							:items="[
								{
									text: $t('auto_increment_integer'),
									value: 'auto_int',
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
							v-model="primaryKeyFieldType"
						/>
					</div>
				</div>
			</v-tab-item>
			<v-tab-item value="optional_system_fields">
				<v-notice type="info">{{ $t('creating_collection_system') }}</v-notice>

				<div class="grid system">
					<div
						class="field"
						v-for="(info, field, index) in systemFields"
						:key="field"
						:class="index % 2 === 0 ? 'half' : 'half-right'"
					>
						<div class="type-label">{{ $t(info.label) }}</div>
						<v-input
							v-model="info.name"
							class="monospace"
							:class="{ active: info.enabled }"
							@click.native="info.enabled = true"
						>
							<template #prepend>
								<v-checkbox v-model="info.enabled" />
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
				:disabled="!collectionName || collectionName.length === 0"
				v-if="currentTab[0] === 'collection_setup'"
				@click="currentTab = ['optional_system_fields']"
				v-tooltip.bottom="$t('next')"
				icon
				rounded
			>
				<v-icon name="arrow_forward" />
			</v-button>
			<v-button
				v-if="currentTab[0] === 'optional_system_fields'"
				@click="save"
				:loading="saving"
				v-tooltip.bottom="$t('finish_setup')"
				icon
				rounded
			>
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from '@vue/composition-api';
import api from '@/api';
import { Field, Relation } from '@/types';
import { useFieldsStore, useCollectionsStore, useRelationsStore } from '@/stores/';
import { notify } from '@/utils/notify';
import router from '@/router';
import i18n from '@/lang';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	setup() {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const currentTab = ref(['collection_setup']);

		const collectionName = ref(null);
		const singleton = ref(false);
		const primaryKeyFieldName = ref('id');
		const primaryKeyFieldType = ref<'auto_int' | 'uuid' | 'manual'>('auto_int');

		const sortField = ref<string>();

		const archiveField = ref<string>();
		const archiveValue = ref<string>();
		const unarchiveValue = ref<string>();

		const systemFields = reactive({
			status: {
				enabled: false,
				name: 'status',
				label: 'status',
				icon: 'flag',
			},
			sort: {
				enabled: false,
				name: 'sort',
				label: 'sort',
				icon: 'low_priority',
			},
			dateCreated: {
				enabled: false,
				name: 'date_created',
				label: 'created_on',
				icon: 'access_time',
			},
			userCreated: {
				enabled: false,
				name: 'user_created',
				label: 'created_by',
				icon: 'account_circle',
			},
			dateUpdated: {
				enabled: false,
				name: 'date_updated',
				label: 'updated_on',
				icon: 'access_time',
			},
			userUpdated: {
				enabled: false,
				name: 'user_updated',
				label: 'updated_by',
				icon: 'account_circle',
			},
		});

		const saving = ref(false);

		return {
			currentTab,
			save,
			systemFields,
			primaryKeyFieldName,
			primaryKeyFieldType,
			collectionName,
			saving,
			singleton,
		};

		async function save() {
			saving.value = true;

			try {
				await api.post(`/collections`, {
					collection: collectionName.value,
					fields: [getPrimaryKeyField(), ...getSystemFields()],
					meta: {
						sort_field: sortField.value,
						archive_field: archiveField.value,
						archive_value: archiveValue.value,
						unarchive_value: unarchiveValue.value,
						singleton: singleton.value,
					},
				});

				const relations = getSystemRelations();

				if (relations.length > 0) {
					await api.post('/relations', relations);
					await relationsStore.hydrate();
				}

				await collectionsStore.hydrate();
				await fieldsStore.hydrate();

				notify({
					title: i18n.t('collection_created'),
					type: 'success',
				});

				router.push(`/settings/data-model/${collectionName.value}`);
			} catch (err) {
				unexpectedError(err);
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
						interface: 'text-input',
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
						interface: 'text-input',
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
					type: 'integer',
					meta: {
						hidden: true,
						interface: 'numeric',
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
									text: 'Published',
									value: 'published',
								},
								{
									text: 'Draft',
									value: 'draft',
								},
								{
									text: 'Archived',
									value: 'archived',
								},
							],
						},
						interface: 'dropdown',
						display: 'labels',
						display_options: {
							showAsDot: true,
							choices: [
								{
									background: '#00C897',
									value: 'published',
								},
								{
									background: '#D3DAE4',
									value: 'draft',
								},
								{
									background: '#F7971C',
									value: 'archived',
								},
							],
						},
					},
					schema: {
						default_value: 'draft',
						is_nullable: false,
					},
				});

				archiveField.value = 'status';
				archiveValue.value = 'archived';
				unarchiveValue.value = 'draft';
			}

			// Sort
			if (systemFields.sort.enabled === true) {
				fields.push({
					field: systemFields.sort.name,
					type: 'integer',
					meta: {
						interface: 'numeric',
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
						interface: 'user',
						options: {
							display: 'both',
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
						interface: 'user',
						options: {
							display: 'both',
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
					many_collection: collectionName.value!,
					many_field: systemFields.userCreated.name,
					many_primary: primaryKeyFieldName.value,
					one_collection: 'directus_users',
					one_primary: 'id',
				});
			}

			if (systemFields.userUpdated.enabled === true) {
				relations.push({
					many_collection: collectionName.value!,
					many_field: systemFields.userUpdated.name,
					many_primary: primaryKeyFieldName.value,
					one_collection: 'directus_users',
					one_primary: 'id',
				});
			}

			return relations;
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.type-title {
	margin-bottom: 48px;
}

.grid {
	@include form-grid;
}

.system {
	::v-deep .v-input {
		.input {
			color: var(--foreground-subdued);
		}

		&.active .input {
			color: var(--foreground-normal);
		}
	}

	.v-icon {
		--v-icon-color: var(--foreground-subdued);
	}
}

.spacer {
	flex-grow: 1;
}

.v-input.monospace {
	--v-input-font-family: var(--family-monospace);
}

.required {
	color: var(--primary);
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.v-notice {
	margin-bottom: 36px;
}
</style>
