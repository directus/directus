<template>
	<v-modal
		:active="true"
		:title="field === '+' ? $t('creating_new_field') : $t('updating_field_field', { field: existingField.name })"
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
				@save="saveField"
				@cancel="cancelField"
			/>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed, reactive, PropType, watch } from '@vue/composition-api';
import SetupTabs from './components/tabs.vue';
import SetupActions from './components/actions.vue';
import SetupSchema from './components/schema.vue';
import SetupRelationship from './components/relationship.vue';
import SetupInterface from './components/interface.vue';
import SetupDisplay from './components/display.vue';
import { i18n } from '@/lang';
import { isEmpty } from 'lodash';
import api from '@/api';
import { Relation } from '@/types';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Field } from '@/types';
import router from '@/router';

import { initLocalStore, state, clearLocalStore } from './store';

export default defineComponent({
	components: {
		SetupTabs,
		SetupActions,
		SetupSchema,
		SetupRelationship,
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
			type: String as PropType<'standard' | 'file' | 'files' | 'm2o' | 'o2m' | 'm2m'>,
			default: null,
		},
	},
	setup(props) {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const existingField = computed(() => {
			if (props.field === '+') return null;

			const existingField = fieldsStore.getField(props.collection, props.field);
			return existingField;
		});

		const localType = computed(() => {
			if (props.field === '+') return props.type;

			let type: 'standard' | 'file' | 'files' | 'o2m' | 'm2m' | 'm2o' = 'standard';
			type = getLocalTypeForField(props.collection, props.field);

			return type;
		});

		initLocalStore(props.collection, props.field, localType.value);

		const { tabs, currentTab } = useTabs();

		const saving = ref(false);

		return {
			// active,
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
					{
						text: i18n.t('display'),
						value: 'display',
						disabled: interfaceDisplayDisabled(),
					},
				];

				if (['o2m', 'm2o', 'm2m', 'files'].includes(localType.value)) {
					tabs.splice(1, 0, {
						text: i18n.t('relationship'),
						value: 'relationship',
						disabled: relationshipDisabled(),
					});
				}

				return tabs;
			});

			const currentTab = ref(['schema']);

			return { tabs, currentTab };

			function relationshipDisabled() {
				return (
					isEmpty(state.fieldData.field) ||
					(['o2m', 'm2m', 'files', 'm2o'].includes(localType.value) === false &&
						isEmpty(state.fieldData.type))
				);
			}

			function interfaceDisplayDisabled() {
				if (['o2m', 'm2o', 'file'].includes(localType.value)) {
					return (
						state.relations.length === 0 ||
						isEmpty(state.relations[0].many_collection) ||
						isEmpty(state.relations[0].many_field) ||
						isEmpty(state.relations[0].one_collection)
					);
				}

				if (['m2m', 'files'].includes(localType.value)) {
					return (
						state.relations.length !== 2 ||
						isEmpty(state.relations[0].many_collection) ||
						isEmpty(state.relations[0].many_field) ||
						isEmpty(state.relations[0].one_field) ||
						isEmpty(state.relations[1].many_collection) ||
						isEmpty(state.relations[1].many_field) ||
						isEmpty(state.relations[1].one_collection)
					);
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
					state.newFields.map((newField: Partial<Field>) => {
						return api.post(`/fields/${newField.collection}`, newField);
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

				await fieldsStore.hydrate();
				await relationsStore.hydrate();
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
		): 'standard' | 'file' | 'files' | 'o2m' | 'm2m' | 'm2o' {
			const fieldInfo = fieldsStore.getField(collection, field);
			const relations = relationsStore.getRelationsForField(collection, field);

			if (relations.length === 0) return 'standard';

			if (relations.length === 1) {
				const relation = relations[0];
				if (relation.one_collection === 'directus_files') return 'file';
				if (relation.many_collection === collection) return 'm2o';
				return 'o2m';
			}

			if (relations.length === 2) {
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
