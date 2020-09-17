<template>
	<v-modal :title="$t('creating_new_collection')" :active="true" class="new-collection" persistent>
		<v-dialog :active="saveError !== null" @toggle="saveError = null">
			<v-card class="selectable">
				<v-card-title>
					{{ saveError && saveError.message }}
				</v-card-title>

				<v-card-text>
					{{ saveError && saveError.response && saveError.response.data.errors[0].message }}
				</v-card-text>

				<v-card-actions>
					<v-button @click="saveError = null">{{ $t('dismiss') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<v-tabs vertical v-model="currentTab">
				<v-tab value="collection">{{ $t('collection_setup') }}</v-tab>
				<v-tab value="system">{{ $t('optional_system_fields') }}</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items v-model="currentTab">
			<v-tab-item value="collection">
				<h2 class="type-title">{{ $t('creating_collection_info') }}</h2>
				<div class="type-label">{{ $t('name') }}</div>
				<v-input
					autofocus
					class="monospace"
					v-model="collectionName"
					db-safe
					:placeholder="$t('a_unique_table_name')"
				/>
				<v-divider />
				<div class="grid">
					<div>
						<div class="type-label">{{ $t('primary_key_field') }}</div>
						<v-input
							class="monospace"
							v-model="primaryKeyFieldName"
							db-safe
							:placeholder="$t('a_unique_column_name')"
						/>
					</div>
					<div>
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
			<v-tab-item value="system">
				<h2 class="type-title">{{ $t('creating_collection_system') }}</h2>
				<div class="grid system">
					<div class="field" v-for="(info, field) in systemFields" :key="field">
						<div class="type-label">{{ $t(info.label) }}</div>
						<v-input v-model="info.name" class="monospace">
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

		<template #footer>
			<v-button secondary to="/settings/data-model">
				{{ $t('cancel') }}
			</v-button>
			<div class="spacer" />
			<v-button
				:disabled="!collectionName || collectionName.length === 0"
				v-if="currentTab[0] === 'collection'"
				@click="currentTab = ['system']"
			>
				{{ $t('next') }}
			</v-button>
			<v-button v-if="currentTab[0] === 'system'" @click="save" :loading="saving">
				{{ $t('finish_setup') }}
			</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from '@vue/composition-api';
import api from '@/api';
import { Field } from '@/types';
import { useFieldsStore, useCollectionsStore } from '@/stores/';
import notify from '@/utils/notify';
import router from '@/router';

export default defineComponent({
	setup() {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const currentTab = ref(['collection']);

		const collectionName = ref(null);
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
		const saveError = ref(null);

		return {
			currentTab,
			save,
			systemFields,
			primaryKeyFieldName,
			primaryKeyFieldType,
			collectionName,
			saveError,
			saving,
		};

		async function save() {
			saving.value = true;

			try {
				await api.post(`/collections`, {
					collection: collectionName.value,
					fields: [getPrimaryKeyField(), ...getSystemFields()],
					sort_field: sortField.value,
					archive_field: archiveField.value,
					archive_value: archiveValue.value,
					unarchive_value: unarchiveValue.value,
				});

				await collectionsStore.hydrate();
				await fieldsStore.hydrate();

				notify({
					title: 'Collection Created',
					type: 'success',
				});

				router.push(`/settings/data-model/${collectionName.value}`);
			} catch (error) {
				console.log(error);
				saveError.value = error;
			} finally {
				saving.value = false;
			}
		}

		function getPrimaryKeyField() {
			const field: DeepPartial<Field> = {
				field: primaryKeyFieldName.value,
				type: 'integer',
				meta: {
					hidden: true,
					interface: 'numeric',
					readonly: true,
				},
				schema: {
					has_auto_increment: true,
					is_primary_key: true,
				},
			};

			if (primaryKeyFieldType.value === 'uuid') {
				return {
					...field,
					type: 'uuid',
					meta: {
						...field.meta,
						interface: 'text-input',
						special: ['uuid'],
					},
					schema: {
						...field.schema,
						length: 36,
						has_auto_increment: false,
					},
				};
			} else if (primaryKeyFieldType.value === 'manual') {
				return {
					...field,
					type: 'string',
					meta: {
						...field.meta,
						interface: 'text-input',
						readonly: false,
						hidden: false,
					},
					schema: {
						...field.schema,
						length: 255,
						auto_increment: false,
					},
				};
			} else {
				// auto_int
				return field;
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
						required: true,
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
						display: 'color-dot',
						display_options: {
							choices: [
								{
									color: '#2F80ED',
									value: 'published',
								},
								{
									color: '#ECEFF1',
									value: 'draft',
								},
								{
									color: '#F2994A',
									value: 'archived',
								},
							],
						}
					},
					schema: {
						default_value: 'draft',
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
							template: '{{first_name}} {{last_name}}',
							display: 'both',
						},
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
							template: '{{first_name}} {{last_name}}',
							display: 'both',
						},
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
					},
					schema: {},
				});
			}

			return fields;
		}
	},
});
</script>

<style lang="scss" scoped>
.type-title {
	margin-bottom: 48px;
}

.type-label {
	margin-bottom: 12px;
}

.v-divider {
	margin: 48px 0;
}

.grid {
	display: grid;
	grid-gap: 48px 36px;
	grid-template-columns: repeat(2, 1fr);
}

.system {
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
</style>
