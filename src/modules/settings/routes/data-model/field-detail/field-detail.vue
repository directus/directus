<template>
	<v-modal :active="active" title="Test" persistent>
		<template #sidebar>
			<setup-tabs :current.sync="currentTab" :tabs="tabs" :type="type" />
		</template>

		<setup-schema
			:collection="collection"
			v-if="currentTab[0] === 'schema'"
			:field-data.sync="fieldData"
			:type="type"
		/>

		<setup-relationship
			:collection="collection"
			v-if="currentTab[0] === 'relationship'"
			:field-data.sync="fieldData"
			:relations.sync="relations"
			:new-fields.sync="newFields"
			:type="type"
		/>

		<setup-interface
			:collection="collection"
			v-if="currentTab[0] === 'interface'"
			:field-data.sync="fieldData"
			:type="type"
		/>

		<setup-display
			:collection="collection"
			v-if="currentTab[0] === 'display'"
			:field-data.sync="fieldData"
			:type="type"
		/>

		<template #footer>
			<setup-actions
				:saving="saving"
				:collection="collection"
				:current.sync="currentTab"
				:tabs="tabs"
				@save="saveField"
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
import { Relation } from '@/stores/relations/types';
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@/stores/fields/types';

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
		// This makes sure we still see the enter animation
		const active = ref(false);
		onMounted(() => {
			active.value = true;
		});

		const fieldsStore = useFieldsStore();

		const { tabs, currentTab } = useTabs();
		const { fieldData, relations, newFields } = useData();

		const saving = ref(false);

		return { active, tabs, currentTab, fieldData, saveField, saving, relations, newFields };

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

				if (['o2m', 'm2o', 'm2m', 'files'].includes(props.type)) {
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
					isEmpty(fieldData.field) ||
					(['o2m', 'm2m', 'files', 'm2o'].includes(props.type) === false && isEmpty(fieldData.database.type))
				);
			}

			function interfaceDisplayDisabled() {
				if (['o2m', 'm2o', 'file'].includes(props.type)) {
					return (
						relations.value.length === 0 ||
						isEmpty(relations.value[0].collection_many) ||
						isEmpty(relations.value[0].field_many) ||
						isEmpty(relations.value[0].collection_one)
					);
				}

				if (['m2m', 'files'].includes(props.type)) {
					return (
						relations.value.length !== 2 ||
						isEmpty(relations.value[0].collection_many) ||
						isEmpty(relations.value[0].field_many) ||
						isEmpty(relations.value[0].field_one) ||
						isEmpty(relations.value[1].collection_many) ||
						isEmpty(relations.value[1].field_many) ||
						isEmpty(relations.value[1].collection_one)
					);
				}

				return isEmpty(fieldData.field) || isEmpty(fieldData.database.type);
			}
		}

		function useData() {
			/** @todo this should technically be a DeepPartial<Field>, but that's a bit annoying to deal with rn */
			const fieldData = reactive<any>({
				field: '',
				database: {
					type: undefined,
					default_value: undefined,
					max_length: undefined,
					is_nullable: true,
				},
				system: {
					hidden: false,
					interface: undefined,
					options: undefined,
					display: undefined,
					display_options: undefined,
					readonly: false,
					special: undefined,
					note: undefined,
				},
			});

			const relations = ref<Partial<Relation>[]>([]);

			// Allow the panes to create additional fields outside of this one. This is used to
			// auto generated related o2m columns / junction collections etc
			const newFields = ref<DeepPartial<Field>[]>([]);

			if (props.type === 'file') {
				fieldData.database.type = 'uuid';

				relations.value = [
					{
						collection_many: props.collection,
						field_many: '',
						primary_many: fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field,
						collection_one: 'directus_files',
						primary_one: fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field,
					},
				];

				watch(
					() => fieldData.field,
					() => {
						relations.value[0].field_many = fieldData.field;
					}
				);
			}

			if (props.type === 'm2o') {
				relations.value = [
					{
						collection_many: props.collection,
						field_many: '',
						primary_many: fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field,
						collection_one: '',
						primary_one: fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field,
					},
				];

				watch(
					() => fieldData.field,
					() => {
						relations.value[0].field_many = fieldData.field;
					}
				);

				// Make sure to keep the current m2o field type in sync with the primary key of the
				// selected related collection
				watch(
					() => relations.value[0].collection_one,
					() => {
						const field = fieldsStore.getPrimaryKeyFieldForCollection(relations.value[0].collection_one);
						fieldData.database.type = field.database.type;
					}
				);
			}

			if (props.type === 'm2m' || props.type === 'files') {
				delete fieldData.database;

				relations.value = [
					{
						collection_many: '',
						field_many: '',
						primary_many: '',
						collection_one: props.collection,
						field_one: fieldData.field,
						primary_one: fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field,
					},
					{
						collection_many: '',
						field_many: '',
						primary_many: '',
						collection_one: props.type === 'files' ? 'directus_files' : '',
						field_one: null,
						primary_one:
							props.type === 'files'
								? fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field
								: '',
					},
				];

				watch(
					() => fieldData.field,
					() => {
						relations.value[0].field_one = fieldData.field;
					}
				);

				watch(
					() => relations.value[0].collection_many,
					() => {
						const pkField = fieldsStore.getPrimaryKeyFieldForCollection(relations.value[0].collection_many)
							?.field;
						relations.value[0].primary_many = pkField;
						relations.value[1].primary_many = pkField;
					}
				);

				watch(
					() => relations.value[0].field_many,
					() => {
						relations.value[1].junction_field = relations.value[0].field_many;
					}
				);

				watch(
					() => relations.value[1].field_many,
					() => {
						relations.value[0].junction_field = relations.value[1].field_many;
					}
				);
			}

			return { fieldData, relations, newFields };
		}

		async function saveField() {
			saving.value = true;

			try {
				await api.post(`/fields/${props.collection}`, fieldData);

				await Promise.all(
					newFields.value.map((newField) => {
						return api.post(`/fields/${newField.collection}`, newField);
					})
				);

				await api.post(`/relations`, relations.value);
			} catch (error) {
				console.error(error);
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>
