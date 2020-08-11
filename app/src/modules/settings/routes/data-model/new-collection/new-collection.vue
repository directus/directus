<template>
	<v-modal :title="$t('creating_new_collection')" :active="true" class="new-collection" persistent>
		<v-dialog :active="saveError !== null" @toggle="saveError = null">
			<v-card class="selectable">
				<v-card-title>
					{{ saveError && saveError.message }}
				</v-card-title>

				<v-card-text>
					{{ saveError && saveError.response && saveErrors.response.data.error.message }}
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
				<v-input class="monospace" v-model="collectionName" db-safe />
				<v-divider />
				<div class="grid">
					<div>
						<div class="type-label">{{ $t('primary_key_field') }}</div>
						<v-input class="monospace" v-model="primaryKeyFieldName" db-safe />
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
					<div class="field" v-for="field in systemFields" :key="field.id">
						<div class="type-label">{{ $t(field.label) }}</div>
						<v-input v-model="field.name" class="monospace">
							<template #prepend>
								<v-checkbox v-model="field.enabled" />
							</template>

							<template #append>
								<v-icon :name="field.icon" />
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
			<v-button secondary @click="currentTab = ['collection']" :disabled="currentTab[0] === 'collection'">
				{{ $t('previous') }}
			</v-button>
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
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const currentTab = ref(['collection']);

		const collectionName = ref(null);
		const primaryKeyFieldName = ref('id');
		const primaryKeyFieldType = ref<'auto_int' | 'uuid' | 'manual'>('auto_int');

		const systemFields = reactive([
			{
				id: 'status',
				enabled: false,
				name: 'status',
				label: 'status',
				icon: 'flag',
			},
			{
				id: 'sort',
				enabled: false,
				name: 'sort',
				label: 'sort',
				icon: 'low_priority',
			},
			/** @TODO re-enable these when the api supports the special types for created/modified by/on */
			// {
			// 	id: 'owner',
			// 	enabled: false,
			// 	name: 'created_by',
			// 	label: 'created_by_owner',
			// 	icon: 'account_circle',
			// },
			// {
			// 	id: 'created_on',
			// 	enabled: false,
			// 	name: 'created_on',
			// 	label: 'created_on',
			// 	icon: 'access_time',
			// },
			// {
			// 	id: 'modified_by',
			// 	enabled: false,
			// 	name: 'modified_by',
			// 	label: 'modified_by',
			// 	icon: 'account_circle',
			// },
			// {
			// 	id: 'modified_on',
			// 	enabled: false,
			// 	name: 'modified_on',
			// 	label: 'modified_on',
			// 	icon: 'access_time',
			// },
		]);

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
				});

				await collectionsStore.hydrate();
				await fieldsStore.hydrate();

				notify({
					title: 'Collection Created',
					type: 'success',
				});

				router.push('/settings/data-model');
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
						special: 'uuid',
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

			if (systemFields[0].enabled === true) {
				fields.push({
					field: systemFields[0].name,
					type: 'string',
					meta: {
						width: 'full',
						required: true,
						options: {
							statuses: {
								published: {
									name: 'Published',
									color: 'white',
									backgroundColor: '#2f80ed',
								},
								draft: {
									name: 'Draft',
									color: 'white',
									backgroundColor: '#eceff1',
								},
								deleted: {
									name: 'Deleted',
									color: 'white',
									backgroundColor: '#eb5757',
									softDelete: true,
								},
							},
						},
						interface: 'status',
					},
					schema: {
						default_value: 'draft',
					},
				});
			}

			if (systemFields[1].enabled === true) {
				fields.push({
					field: systemFields[1].name,
					type: 'integer',
					meta: {
						interface: 'sort',
						hidden: true,
						width: 'full',
						special: 'sort',
					},
					schema: {},
				});
			}

			// if (systemFields[2].enabled === true) {
			// 	fields.push({
			// 		field: systemFields[2].name,
			// 		type: 'uuid',
			// 		meta: {
			// 			special: 'user_created',
			// 			interface: 'owner',
			// 			options: {
			// 				template: '{{first_name}} {{last_name}}',
			// 				display: 'both',
			// 			},
			// 			readonly: true,
			// 			hidden: true,
			// 			width: 'full',
			// 		},
			// 		schema: {},
			// 	});
			// }

			// if (systemFields[3].enabled === true) {
			// 	fields.push({
			// 		field: systemFields[3].name,
			// 		type: 'timestamp',
			// 		meta: {
			// 			special: 'datetime_created',
			// 			interface: 'datetime-created',
			// 			readonly: true,
			// 			hidden: true,
			// 			width: 'full',
			// 		},
			// 	});
			// }

			// if (systemFields[4].enabled === true) {
			// 	fields.push({
			// 		field: systemFields[4].name,
			// 		type: 'uuid',
			// 		meta: {
			// 			special: 'user_updated',
			// 			interface: 'user-updated',
			// 			options: {
			// 				template: '{{first_name}} {{last_name}}',
			// 				display: 'both',
			// 			},
			// 			readonly: true,
			// 			hidden: true,
			// 			width: 'full',
			// 		},
			// 	});
			// }

			// if (systemFields[5].enabled === true) {
			// 	fields.push({
			// 		field: systemFields[5].name,
			// 		type: 'timestamp',
			// 		meta: {
			// 			special: 'datetime_updated',
			// 			interface: 'datetime-updated',
			// 			readonly: true,
			// 			hidden: true,
			// 			width: 'full',
			// 		},
			// 	});
			// }

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
