<template>
	<v-modal
		:title="$t('creating_new_collection')"
		:active="active"
		@toggle="$emit('toggle', $event)"
		class="new-collection"
		persistent
	>
		<v-dialog :active="saveError !== null" @toggle="saveError = null">
			<v-card class="selectable">
				<v-card-title>
					{{ saveError && saveError.message }}
				</v-card-title>

				<v-card-text>
					{{ saveError && saveError.response.data.error.message }}
				</v-card-text>

				<v-card-actions>
					<v-button @click="saveError = null">{{ $t('dismiss') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<v-tabs vertical v-model="currentTab">
				<v-tab value="collection">Collection Setup</v-tab>
				<v-tab value="system">Optional System Fields</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items v-model="currentTab">
			<v-tab-item value="collection">
				<h2 class="type-title">{{ $t('creating_collection_info') }}</h2>
				<div class="type-label">{{ $t('name') }}</div>
				<v-input full-width monospace v-model="collectionName" />
				<v-divider />
				<div class="grid">
					<div>
						<div class="type-label">{{ $t('primary_key_field') }}</div>
						<v-input full-width monospace v-model="primaryKeyFieldName" />
					</div>
					<div>
						<div class="type-label">{{ $t('type') }}</div>
						<v-select
							full-width
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
						<v-input v-model="field.name" monospace>
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
			<v-button secondary outlined @click="$emit('toggle', false)">
				{{ $t('cancel') }}
			</v-button>
			<div class="spacer" />
			<v-button
				secondary
				@click="currentTab = ['collection']"
				:disabled="currentTab[0] === 'collection'"
			>
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
import useProjectsStore from '@/stores/projects';
import { Field } from '@/stores/fields/types';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';
import notify from '@/utils/notify';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const projectsStore = useProjectsStore();
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
			{
				id: 'owner',
				enabled: false,
				name: 'created_by',
				label: 'created_by_owner',
				icon: 'account_circle',
			},
			{
				id: 'created_on',
				enabled: false,
				name: 'created_on',
				label: 'created_on',
				icon: 'access_time',
			},
			{
				id: 'modified_by',
				enabled: false,
				name: 'modified_by',
				label: 'modified_by',
				icon: 'account_circle',
			},
			{
				id: 'modified_on',
				enabled: false,
				name: 'modified_on',
				label: 'modified_on',
				icon: 'access_time',
			},
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
			const { currentProjectKey } = projectsStore.state;
			saving.value = true;

			try {
				await api.post(`/${currentProjectKey}/collections`, {
					collection: collectionName.value,
					fields: [getPrimaryKeyField(), ...getSystemFields()],
				});

				await collectionsStore.hydrate();
				await fieldsStore.hydrate();

				notify({
					title: 'Collection Created',
					type: 'success',
				});

				emit('toggle', false);
			} catch (error) {
				saveError.value = error;
			} finally {
				saving.value = false;
			}
		}

		function getPrimaryKeyField() {
			const field: Partial<Field> = {
				auto_increment: true,
				field: primaryKeyFieldName.value,
				hidden_browse: false,
				hidden_detail: false,
				interface: 'numeric',
				length: 15,
				primary_key: true,
				type: 'integer',
				datatype: 'INT',
				readonly: true,
			};

			if (primaryKeyFieldType.value === 'uuid') {
				return {
					...field,
					interface: 'text-input',
					type: 'string',
					datatype: 'VARCHAR',
					length: 36,
					auto_increment: false,
				};
			} else if (primaryKeyFieldType.value === 'manual') {
				return {
					...field,
					interface: 'text-input',
					type: 'string',
					datatype: 'VARCHAR',
					length: 255,
					auto_increment: false,
					readonly: false,
				};
			} else {
				// auto_int
				return field;
			}
		}

		function getSystemFields() {
			const fields: Partial<Field>[] = [];

			if (systemFields[0].enabled === true) {
				fields.push({
					type: 'status',
					datatype: 'VARCHAR',
					length: 20,
					field: systemFields[0].name,
					interface: 'status',
					default_value: 'draft',
					width: 'full',
					required: true,
					options: {
						status_mapping: {
							published: {
								name: 'Published',
								value: 'published',
								text_color: 'white',
								background_color: 'accent',
								browse_subdued: false,
								browse_badge: true,
								soft_delete: false,
								published: true,
								required_fields: true,
							},
							draft: {
								name: 'Draft',
								value: 'draft',
								text_color: 'white',
								background_color: 'blue-grey-100',
								browse_subdued: true,
								browse_badge: true,
								soft_delete: false,
								published: false,
								required_fields: false,
							},
							deleted: {
								name: 'Deleted',
								value: 'deleted',
								text_color: 'white',
								background_color: 'red',
								browse_subdued: true,
								browse_badge: true,
								soft_delete: true,
								published: false,
								required_fields: false,
							},
						},
					},
				});
			}

			if (systemFields[1].enabled === true) {
				fields.push({
					type: 'sort',
					datatype: 'INT',
					field: systemFields[1].name,
					interface: 'sort',
					hidden_detail: true,
					hidden_browse: true,
					width: 'full',
				});
			}

			if (systemFields[2].enabled === true) {
				fields.push({
					type: 'owner',
					datatype: 'INT',
					field: systemFields[2].name,
					interface: 'owner',
					options: {
						template: '{{first_name}} {{last_name}}',
						display: 'both',
					},
					readonly: true,
					hidden_detail: true,
					hidden_browse: true,
					width: 'full',
				});
			}

			if (systemFields[3].enabled === true) {
				fields.push({
					type: 'datetime_created',
					datatype: 'DATETIME',
					field: systemFields[3].name,
					interface: 'datetime-created',
					readonly: true,
					hidden_detail: true,
					hidden_browse: true,
					width: 'full',
				});
			}

			if (systemFields[4].enabled === true) {
				fields.push({
					type: 'user_updated',
					datatype: 'INT',
					field: systemFields[4].name,
					interface: 'user-updated',
					options: {
						template: '{{first_name}} {{last_name}}',
						display: 'both',
					},
					readonly: true,
					hidden_detail: true,
					hidden_browse: true,
					width: 'full',
				});
			}

			if (systemFields[5].enabled === true) {
				fields.push({
					type: 'datetime_updated',
					datatype: 'DATETIME',
					field: systemFields[5].name,
					interface: 'datetime-updated',
					readonly: true,
					hidden_detail: true,
					hidden_browse: true,
					width: 'full',
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
</style>
