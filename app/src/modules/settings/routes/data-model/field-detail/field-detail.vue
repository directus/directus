<template>
	<v-modal
		:active="true"
		:title="
			field === '+'
				? $t('creating_new_field', { collection: collectionInfo.name })
				: $t('updating_field_field', { field: existingField.name, collection: collectionInfo.name })
		"
		:subtitle="localType ? $t(`field_${localType}`) : null"
		persistent
	>
		<template #sidebar>
			<setup-tabs :current.sync="currentTab" :tabs="tabs" :type="localType" />
		</template>

		<setup-schema
			v-if="currentTab[0] === 'schema'"
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

		<setup-languages
			v-if="currentTab[0] === 'languages'"
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

		<template #footer>
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
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed, reactive, PropType, watch, toRefs } from '@vue/composition-api';
import SetupTabs from './components/tabs.vue';
import SetupActions from './components/actions.vue';
import SetupSchema from './components/schema.vue';
import SetupRelationship from './components/relationship.vue';
import SetupTranslations from './components/translations.vue';
import SetupLanguages from './components/languages.vue';
import SetupInterface from './components/interface.vue';
import SetupDisplay from './components/display.vue';
import { i18n } from '@/lang';
import { isEmpty } from 'lodash';
import api from '@/api';
import { Relation, Collection } from '@/types';
import { useFieldsStore, useRelationsStore, useCollectionsStore } from '@/stores/';
import { Field } from '@/types';
import router from '@/router';
import useCollection from '@/composables/use-collection';
import notify from '@/utils/notify';

import { initLocalStore, state, clearLocalStore } from './store';

export default defineComponent({
	components: {
		SetupTabs,
		SetupActions,
		SetupSchema,
		SetupRelationship,
		SetupTranslations,
		SetupLanguages,
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
			type: String as PropType<'standard' | 'file' | 'files' | 'm2o' | 'o2m' | 'm2m' | 'presentation' | 'translations'>,
			default: null,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const { collection } = toRefs(props);
		const { info: collectionInfo } = useCollection(collection);

		const existingField = computed(() => {
			if (props.field === '+') return null;

			const existingField = fieldsStore.getField(props.collection, props.field);
			return existingField;
		});

		const localType = computed(() => {
			if (props.field === '+') return props.type;

			let type: 'standard' | 'file' | 'files' | 'o2m' | 'm2m' | 'm2o' | 'presentation' | 'translations' = 'standard';
			type = getLocalTypeForField(props.collection, props.field);

			return type;
		});

		initLocalStore(props.collection, props.field, localType.value);

		const { tabs, currentTab } = useTabs();

		const saving = ref(false);

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

				if (['o2m', 'm2o', 'm2m', 'files'].includes(localType.value)) {
					tabs.splice(1, 0, {
						text: i18n.t('relationship'),
						value: 'relationship',
						disabled: relationshipDisabled(),
					});
				}

				if (localType.value === 'translations') {
					tabs.splice(1, 0, ...[
						{
							text: i18n.t('translations'),
							value: 'translations',
							disabled: translationsDisabled(),
						},
						{
							text: i18n.t('languages'),
							value: 'languages',
							disabled: languagesDisabled(),
						}
					])
				}

				return tabs;
			});

			const currentTab = ref(['schema']);

			return { tabs, currentTab };

			function relationshipDisabled() {
				return isEmpty(state.fieldData.field);
			}

			function translationsDisabled() {
				return isEmpty(state.fieldData.field);
			}

			function languagesDisabled() {
				return isEmpty(state.fieldData.field) || (
					state.relations.length === 0 ||
					isEmpty(state.relations[0].many_collection) ||
					isEmpty(state.relations[0].many_field) ||
					isEmpty(state.relations[0].one_collection) ||
					isEmpty(state.relations[0].one_primary)
				);
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

				if (localType.value === 'presentation') {
					return isEmpty(state.fieldData.field);
				}

				return isEmpty(state.fieldData.field) || isEmpty(state.fieldData.type);
			}
		}

		async function saveField() {
			saving.value = true;

			try {
				if (props.field !== '+') {
					await api.patch(`/fields/${props.collection}/${props.field}`, state.fieldData);
				} else {
					await api.post(`/fields/${props.collection}`, state.fieldData);
				}

				await Promise.all(
					state.newCollections.map((newCollection: Partial<Collection> & { $type: string }) => {
						delete newCollection.$type;
						return api.post(`/collections`, newCollection);
					})
				);

				await Promise.all(
					state.newFields.map((newField: Partial<Field> & { $type: string }) => {
						delete newField.$type;
						return api.post(`/fields/${newField.collection}`, newField);
					})
				);

				await Promise.all(
					state.updateFields.map((updateField: Partial<Field> & { $type: string }) => {
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
						title: i18n.t('field_create_success', { field: state.fieldData.field }),
						type: 'success',
					});
				}

				router.push(`/settings/data-model/${props.collection}`);
				clearLocalStore();
			} catch (error) {
				console.error(error);
			} finally {
				saving.value = false;
			}
		}

		function cancelField() {
			router.push(`/settings/data-model/${props.collection}`);
			clearLocalStore();
		}

		function getLocalTypeForField(
			collection: string,
			field: string
		): 'standard' | 'file' | 'files' | 'o2m' | 'm2m' | 'm2o' | 'presentation' | 'translations' {
			const fieldInfo = fieldsStore.getField(collection, field);
			const relations = relationsStore.getRelationsForField(collection, field);

			if (relations.length === 0) {
				if (fieldInfo.type === 'alias') return 'presentation';
				return 'standard';
			}

			if (relations.length === 1) {
				const relation = relations[0];
				if (relation.one_collection === 'directus_files') return 'file';
				if (relation.many_collection === collection) return 'm2o';
				return 'o2m';
			}

			if (relations.length === 2) {
				const relationForCurrent = relations.find(
					(relation: Relation) =>
						(relation.many_collection === collection && relation.many_field === field) ||
						(relation.one_collection === collection && relation.one_field === field)
				);

				if (relationForCurrent?.many_collection === collection && relationForCurrent?.many_field === field)
					return 'm2o';

				if (
					relations[0].one_collection === 'directus_files' ||
					relations[1].one_collection === 'directus_files'
				) {
					return 'files';
				} else {
					return 'm2m';
				}
			}

			return 'standard';
		}
	},
});
</script>
