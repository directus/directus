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
		const { fieldData, relations } = useData();

		const saving = ref(false);

		return { active, tabs, currentTab, fieldData, saveField, saving, relations };

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

				if (['o2m', 'm2o', 'm2m'].includes(props.type)) {
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
				return isEmpty(fieldData.field) || isEmpty(fieldData.database.type);
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
					/** @todo extend with all values */
					return relations.value.length !== 2;
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
					comment: undefined,
				},
				system: {
					hidden: false,
					interface: undefined,
					options: undefined,
					display: undefined,
					display_options: undefined,
					readonly: false,
					special: undefined,
				},
			});

			const relations = ref<Partial<Relation>[]>([]);

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

			return { fieldData, relations };
		}

		async function saveField() {
			saving.value = true;

			try {
				await api.post(`/fields/${props.collection}`, fieldData);
			} catch (error) {
				console.error(error);
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>
