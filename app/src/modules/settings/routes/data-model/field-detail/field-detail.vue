<template>
	<v-dialog
		v-if="localType === 'translations' && translationsManual === false && field === '+'"
		persistent
		:model-value="isOpen"
		@esc="cancelField"
	>
		<v-card class="auto-translations">
			<v-card-title>{{ t('create_translations') }}</v-card-title>
			<v-card-text>
				<v-input v-model="fieldData.field" :placeholder="t('field_name') + '...'" />
				<v-notice>
					<div>
						{{ t('this_will_auto_setup_fields_relations') }}
						<button class="manual-toggle" @click="translationsManual = true">{{ t('click_here') }}</button>
						{{ t('to_manually_setup_translations') }}
					</div>
				</v-notice>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="cancelField">{{ t('cancel') }}</v-button>
				<div class="spacer" />
				<v-button :disabled="!fieldData.field" :loading="saving" @click="saveField">
					{{ t('auto_generate') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-drawer
		v-else
		:model-value="isOpen"
		:title="title"
		:subtitle="localType ? t(`field_${localType}`) : null"
		persistent
		:sidebar-label="currentTabInfo.text"
		@update:model-value="cancelField"
		@cancel="cancelField"
	>
		<template #sidebar>
			<setup-tabs v-model:current="currentTab" :tabs="tabs" :type="localType" />
		</template>

		<div class="content">
			<setup-schema
				v-if="currentTab[0] === 'schema'"
				:is-existing="field !== '+'"
				:collection="collection"
				:type="localType"
			/>

			<setup-field
				v-if="currentTab[0] === 'field'"
				:is-existing="field !== '+'"
				:collection="collection"
				:type="localType"
			/>

			<setup-relationship
				v-if="currentTab[0] === 'relationship'"
				:is-existing="field !== '+'"
				:collection="collection"
				:type="localType"
			/>

			<setup-translations
				v-if="currentTab[0] === 'translations'"
				:is-existing="field !== '+'"
				:collection="collection"
				:type="localType"
			/>

			<setup-interface
				v-if="currentTab[0] === 'interface'"
				:is-existing="field !== '+'"
				:collection="collection"
				:type="localType"
			/>

			<setup-display
				v-if="currentTab[0] === 'display'"
				:is-existing="field !== '+'"
				:collection="collection"
				:type="localType"
			/>

			<setup-conditions v-if="currentTab[0] === 'conditions'" :collection="collection" :type="localType" />
		</div>

		<template #actions>
			<setup-actions
				v-model:current="currentTab"
				:saving="saving"
				:collection="collection"
				:tabs="tabs"
				:is-existing="field !== '+'"
				@save="saveField"
				@cancel="cancelField"
			/>
		</template>

		<v-dialog v-model="nullValuesDialog" @esc="nullValuesDialog = false">
			<v-card>
				<v-card-title>{{ t('enter_value_to_replace_nulls') }}</v-card-title>
				<v-card-text>
					<v-input v-model="nullValueOverride" placeholder="NULL" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="nullValuesDialog = false">{{ t('cancel') }}</v-button>
					<v-button :disabled="nullValueOverride === null" :loading="nullOverrideSaving" @click="saveNullOverride">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-drawer>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, PropType, toRefs } from 'vue';
import SetupTabs from './components/tabs.vue';
import SetupActions from './components/actions.vue';
import SetupSchema from './components/schema.vue';
import SetupField from './components/field.vue';
import SetupRelationship from './components/relationship.vue';
import SetupTranslations from './components/translations.vue';
import SetupInterface from './components/interface.vue';
import SetupDisplay from './components/display.vue';
import SetupConditions from './components/conditions.vue';
import { isEmpty, cloneDeep } from 'lodash';
import api from '@/api';
import { useFieldsStore, useRelationsStore, useCollectionsStore } from '@/stores/';
import { useRouter } from 'vue-router';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useCollection } from '@directus/shared/composables';
import { getLocalTypeForField } from '../get-local-type';
import { notify } from '@/utils/notify';
import formatTitle from '@directus/format-title';
import { LocalType } from '@directus/shared/types';

import { initLocalStore, state, clearLocalStore } from './store';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	components: {
		SetupTabs,
		SetupActions,
		SetupSchema,
		SetupField,
		SetupRelationship,
		SetupTranslations,
		SetupInterface,
		SetupDisplay,
		SetupConditions,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<LocalType>,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const isOpen = useDialogRoute();

		const translationsManual = ref(false);

		const { collection } = toRefs(props);
		const { info: collectionInfo } = useCollection(collection);

		const { nullValueOverride, nullValuesDialog, nullOverrideSaving, saveNullOverride } = useContainsNull();

		const existingField = computed(() => {
			if (props.field === '+') return null;

			const existingField = fieldsStore.getField(props.collection, props.field);
			return existingField;
		});

		const localType = computed(() => {
			if (props.field === '+') return props.type;

			const type = getLocalTypeForField(props.collection, props.field) || 'standard';

			return type;
		});

		initLocalStore(props.collection, props.field, localType.value);

		const { tabs, currentTab, currentTabInfo } = useTabs();

		const saving = ref(false);

		const title = computed(() => {
			const fieldName = existingField.value?.name || formatTitle(state.fieldData.field || '');

			if (props.field === '+' && fieldName === '')
				return t('creating_new_field', { collection: collectionInfo.value?.name });
			else return t('field_in_collection', { field: fieldName, collection: collectionInfo.value?.name });
		});

		return {
			t,
			isOpen,
			tabs,
			currentTab,
			fieldData: state.fieldData,
			saveField,
			saving,
			relations: state.relations,
			newFields: state.newFields,
			cancelField,
			localType,
			existingField,
			collectionInfo,
			translationsManual,
			currentTabInfo,
			title,
			nullValuesDialog,
			nullValueOverride,
			nullOverrideSaving,
			saveNullOverride,
		};

		function useTabs() {
			const tabs = computed(() => {
				const tabs = [
					{
						text: t('schema'),
						value: 'schema',
						disabled: false,
					},
					{
						text: t('field', 1),
						value: 'field',
						disabled: interfaceDisplayDisabled(),
					},
					{
						text: t('interface_label'),
						value: 'interface',
						disabled: interfaceDisplayDisabled(),
					},
				];

				if (props.type !== 'presentation' && props.type !== 'group') {
					tabs.push({
						text: t('display'),
						value: 'display',
						disabled: interfaceDisplayDisabled(),
					});
				}

				if (['o2m', 'm2o', 'm2m', 'm2a', 'files'].includes(localType.value)) {
					tabs.splice(1, 0, {
						text: t('relationship'),
						value: 'relationship',
						disabled: relationshipDisabled(),
					});
				}

				if (localType.value === 'translations') {
					tabs.splice(
						1,
						0,
						...[
							{
								text: t('translations'),
								value: 'translations',
								disabled: translationsDisabled(),
							},
						]
					);
				}

				tabs.push({
					text: t('conditions'),
					value: 'conditions',
					disabled: interfaceDisplayDisabled(),
				});

				return tabs;
			});

			const currentTab = ref(['schema']);

			const currentTabInfo = computed(() => {
				const tabKey = currentTab.value[0];
				return tabs.value.find((tab) => tab.value === tabKey);
			});

			return { tabs, currentTab, currentTabInfo };

			function relationshipDisabled() {
				return isEmpty(state.fieldData.field);
			}

			function translationsDisabled() {
				return isEmpty(state.fieldData.field);
			}

			function interfaceDisplayDisabled() {
				if (['o2m', 'm2o', 'file'].includes(localType.value)) {
					return (
						state.relations.length === 0 ||
						isEmpty(state.relations[0].collection) ||
						isEmpty(state.relations[0].field) ||
						isEmpty(state.relations[0].related_collection)
					);
				}

				if (['m2m', 'files', 'translations'].includes(localType.value)) {
					return (
						state.relations.length !== 2 ||
						isEmpty(state.relations[0].collection) ||
						isEmpty(state.relations[0].field) ||
						isEmpty(state.relations[0].meta?.one_field) ||
						isEmpty(state.relations[1].collection) ||
						isEmpty(state.relations[1].field) ||
						isEmpty(state.relations[1].related_collection)
					);
				}

				if (localType.value === 'm2a') {
					return (
						state.relations.length !== 2 ||
						isEmpty(state.relations[0].collection) ||
						isEmpty(state.relations[0].field) ||
						isEmpty(state.relations[0].meta?.one_field) ||
						isEmpty(state.relations[1].collection) ||
						isEmpty(state.relations[1].field) ||
						isEmpty(state.relations[1].meta?.one_collection_field) ||
						isEmpty(state.relations[1].meta?.one_allowed_collections)
					);
				}

				if (localType.value === 'presentation') {
					return isEmpty(state.fieldData.field);
				}

				return isEmpty(state.fieldData.field) || isEmpty(state.fieldData.type);
			}
		}

		async function saveField() {
			saving.value = true;

			const fieldData = cloneDeep(state.fieldData);

			// You can't alter PK columns in most database drivers. If this field is the PK, remove `schema` so we don't
			// accidentally try altering the column

			if (fieldData.schema?.is_primary_key === true) {
				delete fieldData.schema;
			}

			try {
				if (props.field !== '+') {
					await api.patch(`/fields/${props.collection}/${props.field}`, fieldData);
				} else {
					await api.post(`/fields/${props.collection}`, fieldData);
				}

				await Promise.all(
					state.newCollections.map((newCollection) => {
						delete newCollection.$type;
						return api.post(`/collections`, newCollection);
					})
				);

				await Promise.all(
					state.newFields.map((newField) => {
						delete newField.$type;
						return api.post(`/fields/${newField.collection}`, newField);
					})
				);

				await Promise.all(
					state.updateFields.map((updateField) => {
						delete updateField.$type;
						return api.post(`/fields/${updateField.collection}/${updateField.field}`, updateField);
					})
				);

				await Promise.all(
					state.relations.map((relation) => {
						const relationExists = !!relationsStore.getRelationForField(relation.collection!, relation.field!);

						if (relationExists) {
							return api.patch(`/relations/${relation.collection}/${relation.field}`, relation);
						} else {
							return api.post(`/relations`, relation);
						}
					})
				);

				await Promise.all(
					Object.keys(state.newRows).map((collection) => {
						const rows = state.newRows[collection];
						return api.post(`/items/${collection}`, rows);
					})
				);

				await collectionsStore.hydrate();
				await fieldsStore.hydrate();
				await relationsStore.hydrate();

				if (props.field !== '+') {
					notify({
						title: t('field_update_success', { field: props.field }),
						type: 'success',
					});
				} else {
					notify({
						title: t('field_create_success', { field: fieldData.field }),
						type: 'success',
					});
				}

				router.push(`/settings/data-model/${props.collection}`);
				clearLocalStore();
			} catch (err: any) {
				if (err?.response?.data?.errors?.[0]?.extensions?.code === 'CONTAINS_NULL_VALUES') {
					nullValueOverride.value = state.fieldData?.schema?.default_value || null;
					nullValuesDialog.value = true;
				} else {
					unexpectedError(err);
				}
			} finally {
				saving.value = false;
			}
		}

		function cancelField() {
			router.push(`/settings/data-model/${props.collection}`);
			clearLocalStore();
		}

		/**
		 * In case you're setting allow null to false and you have null values already stored, we need
		 * to override those null values with a new value before you can try saving again
		 */
		function useContainsNull() {
			const nullValuesDialog = ref(false);
			const nullValueOverride = ref();
			const nullOverrideSaving = ref(false);

			return { nullValueOverride, nullValuesDialog, nullOverrideSaving, saveNullOverride };

			async function saveNullOverride() {
				nullOverrideSaving.value = true;

				try {
					const endpoint = props.collection.startsWith('directus_')
						? `/${props.collection.substring(9)}`
						: `/items/${props.collection}`;

					await api.patch(endpoint, {
						query: {
							filter: {
								[props.field]: {
									_null: true,
								},
							},
							limit: -1,
						},
						data: {
							[props.field]: nullValueOverride.value,
						},
					});

					nullValuesDialog.value = false;
					return saveField();
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					nullOverrideSaving.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.auto-translations {
	.v-input {
		--v-input-font-family: var(--family-monospace);
	}

	.v-notice {
		margin-top: 12px;
	}

	.spacer {
		flex-grow: 1;
	}

	.manual-toggle {
		color: var(--primary);
	}
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}
</style>
