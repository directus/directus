<template>
	<v-dialog
		persistent
		:active="true"
		@esc="cancelField"
		v-if="localType === 'translations' && translationsManual === false && field === '+'"
	>
		<v-card class="auto-translations">
			<v-card-title>{{ $t('create_translations') }}</v-card-title>
			<v-card-text>
				<v-input v-model="fieldData.field" :placeholder="$t('field_name') + '...'" />
				<v-notice>
					<div>
						{{ $t('this_will_auto_setup_fields_relations') }}
						<button class="manual-toggle" @click="translationsManual = true">{{ $t('click_here') }}</button>
						{{ $t('to_manually_setup_translations') }}
					</div>
				</v-notice>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="cancelField">{{ $t('cancel') }}</v-button>
				<div class="spacer" />
				<v-button :disabled="!fieldData.field" :loading="saving" @click="saveField">
					{{ $t('auto_generate') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-drawer
		v-else
		:active="true"
		@toggle="cancelField"
		@cancel="cancelField"
		:title="title"
		:subtitle="localType ? $t(`field_${localType}`) : null"
		persistent
		:sidebar-label="currentTabInfo.text"
	>
		<template #sidebar>
			<setup-tabs :current.sync="currentTab" :tabs="tabs" :type="localType" />
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
		</div>

		<template #actions>
			<setup-actions
				:saving="saving"
				:collection="collection"
				:current.sync="currentTab"
				:tabs="tabs"
				:is-existing="field !== '+'"
				@save="saveField"
				@cancel="cancelField"
			/>
		</template>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, toRefs } from '@vue/composition-api';
import SetupTabs from './components/tabs.vue';
import SetupActions from './components/actions.vue';
import SetupSchema from './components/schema.vue';
import SetupField from './components/field.vue';
import SetupRelationship from './components/relationship.vue';
import SetupTranslations from './components/translations.vue';
import SetupInterface from './components/interface.vue';
import SetupDisplay from './components/display.vue';
import { i18n } from '@/lang';
import { isEmpty, cloneDeep } from 'lodash';
import api from '@/api';
import { Relation, Collection } from '@/types';
import { useFieldsStore, useRelationsStore, useCollectionsStore } from '@/stores/';
import { Field } from '@/types';
import router from '@/router';
import useCollection from '@/composables/use-collection';
import { getLocalTypeForField } from '../get-local-type';
import { notify } from '@/utils/notify';
import formatTitle from '@directus/format-title';

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
			type: String as PropType<
				'standard' | 'file' | 'files' | 'm2o' | 'o2m' | 'm2m' | 'm2a' | 'presentation' | 'translations'
			>,
			default: null,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const translationsManual = ref(false);

		const { collection } = toRefs(props);
		const { info: collectionInfo } = useCollection(collection);

		const existingField = computed(() => {
			if (props.field === '+') return null;

			const existingField = fieldsStore.getField(props.collection, props.field);
			return existingField;
		});

		const localType = computed(() => {
			if (props.field === '+') return props.type;

			let type: 'standard' | 'file' | 'files' | 'o2m' | 'm2m' | 'm2a' | 'm2o' | 'presentation' | 'translations' =
				'standard';
			type = getLocalTypeForField(props.collection, props.field);

			return type;
		});

		initLocalStore(props.collection, props.field, localType.value);

		const { tabs, currentTab, currentTabInfo } = useTabs();

		const saving = ref(false);

		const title = computed(() => {
			const fieldName = existingField.value?.name || formatTitle(state.fieldData.field || '');

			if (props.field === '+' && fieldName === '')
				return i18n.t('creating_new_field', { collection: collectionInfo.value?.name });
			else return i18n.t('field_in_collection', { field: fieldName, collection: collectionInfo.value?.name });
		});

		return {
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
		};

		function useTabs() {
			const tabs = computed(() => {
				const tabs = [
					{
						text: i18n.t('schema'),
						value: 'schema',
						disabled: false,
					},
					{
						text: i18n.tc('field', 1),
						value: 'field',
						disabled: interfaceDisplayDisabled(),
					},
					{
						text: i18n.t('interface'),
						value: 'interface',
						disabled: interfaceDisplayDisabled(),
					},
				];

				if (state.fieldData.type !== 'alias' && localType.value !== 'presentation') {
					tabs.push({
						text: i18n.t('display'),
						value: 'display',
						disabled: interfaceDisplayDisabled(),
					});
				}

				if (['o2m', 'm2o', 'm2m', 'm2a', 'files'].includes(localType.value)) {
					tabs.splice(1, 0, {
						text: i18n.t('relationship'),
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
								text: i18n.t('translations'),
								value: 'translations',
								disabled: translationsDisabled(),
							},
						]
					);
				}

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
						isEmpty(state.relations[0].many_collection) ||
						isEmpty(state.relations[0].many_field) ||
						isEmpty(state.relations[0].one_collection) ||
						isEmpty(state.relations[0].one_primary)
					);
				}

				if (['m2m', 'files', 'translations'].includes(localType.value)) {
					return (
						state.relations.length !== 2 ||
						isEmpty(state.relations[0].many_collection) ||
						isEmpty(state.relations[0].many_field) ||
						isEmpty(state.relations[0].one_field) ||
						isEmpty(state.relations[1].many_collection) ||
						isEmpty(state.relations[1].many_field) ||
						isEmpty(state.relations[1].one_collection) ||
						isEmpty(state.relations[1].one_primary)
					);
				}

				if (localType.value === 'm2a') {
					return (
						state.relations.length !== 2 ||
						isEmpty(state.relations[0].many_collection) ||
						isEmpty(state.relations[0].many_field) ||
						isEmpty(state.relations[0].one_field) ||
						isEmpty(state.relations[1].many_collection) ||
						isEmpty(state.relations[1].many_field) ||
						isEmpty(state.relations[1].one_collection_field) ||
						isEmpty(state.relations[1].one_allowed_collections)
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
					state.newCollections.map((newCollection: Partial<Collection> & { $type?: string }) => {
						delete newCollection.$type;
						return api.post(`/collections`, newCollection);
					})
				);

				await Promise.all(
					state.newFields.map((newField: Partial<Field> & { $type?: string }) => {
						delete newField.$type;
						return api.post(`/fields/${newField.collection}`, newField);
					})
				);

				await Promise.all(
					state.updateFields.map((updateField: Partial<Field> & { $type?: string }) => {
						delete updateField.$type;
						return api.post(`/fields/${updateField.collection}/${updateField.field}`, updateField);
					})
				);

				await Promise.all(
					state.relations.map((relation: Partial<Relation>) => {
						if (relation.id) {
							return api.patch(`/relations/${relation.id}`, relation);
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
						title: i18n.t('field_update_success', { field: props.field }),
						type: 'success',
					});
				} else {
					notify({
						title: i18n.t('field_create_success', { field: fieldData.field }),
						type: 'success',
					});
				}

				router.push(`/settings/data-model/${props.collection}`);
				clearLocalStore();
			} catch (err) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}

		function cancelField() {
			router.push(`/settings/data-model/${props.collection}`);
			clearLocalStore();
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
	padding-bottom: var(--content-padding);
}
</style>
