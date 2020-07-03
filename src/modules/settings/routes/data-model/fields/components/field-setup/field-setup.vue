<template>
	<v-modal
		:active="active"
		:title="title"
		:subtitle="$t('within_collection', { collection: collectionInfo.name })"
		persistent
	>
		<template #sidebar>
			<setup-tabs
				:current-tab.sync="currentTab"
				:tabs="tabs"
				:field="field"
				:local-type="localType"
				:is-new="isNew"
			/>
		</template>

		<div class="content">
			<field-setup-field
				v-if="currentTab[0] === 'field'"
				v-model="field"
				:local-type.sync="localType"
				:is-new="isNew"
			/>
			<field-setup-relationship
				v-if="currentTab[0] === 'relationship'"
				v-model="field"
				:local-type.sync="localType"
				:is-new="isNew"
				:new-relations.sync="newRelations"
			/>
			<field-setup-interface
				v-if="currentTab[0] === 'interface'"
				v-model="field"
				:local-type.sync="localType"
				:is-new="isNew"
			/>
			<field-setup-display
				v-if="currentTab[0] === 'display'"
				v-model="field"
				:local-type.sync="localType"
				:is-new="isNew"
			/>
			<field-setup-schema
				v-if="currentTab[0] === 'schema'"
				v-model="field"
				:local-type.sync="localType"
				:is-new="isNew"
			/>
		</div>

		<template #footer>
			<setup-actions
				:current-tab.sync="currentTab"
				:tabs="tabs"
				:field="field"
				:local-type="localType"
				:is-new="existingField === null"
				:saving="saving"
				@cancel="$emit('toggle', false)"
				@save="save"
			/>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, ref, computed, toRefs } from '@vue/composition-api';
import { Field } from '@/stores/fields/types';
import i18n from '@/lang';
import FieldSetupField from './field-setup-field.vue';
import FieldSetupRelationship from './field-setup-relationship.vue';
import FieldSetupInterface from './field-setup-interface.vue';
import FieldSetupDisplay from './field-setup-display.vue';
import FieldSetupSchema from './field-setup-schema.vue';
import SetupTabs from './setup-tabs.vue';
import SetupActions from './setup-actions.vue';
import useFieldsStore from '@/stores/fields/';
import { Relation } from '@/stores/relations/types';
import api from '@/api';

import { LocalType } from './types';
import { localTypeGroups } from './index';
import { Type } from '@/stores/fields/types';
import useCollection from '@/composables/use-collection';

export default defineComponent({
	components: {
		FieldSetupField,
		FieldSetupRelationship,
		FieldSetupInterface,
		FieldSetupDisplay,
		FieldSetupSchema,
		SetupTabs,
		SetupActions,
	},
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		existingField: {
			type: Object as PropType<Field>,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();

		const { collection } = toRefs(props);

		const { info: collectionInfo } = useCollection(collection);

		const { field, localType } = useField();
		const { tabs, currentTab } = useTabs();
		const { save, saving } = useSave();

		const newRelations = ref<Partial<Relation>[]>([]);
		const isNew = computed(() => props.existingField === null);
		const title = computed(() =>
			isNew.value
				? i18n.t('creating_new_field')
				: i18n.t('updating_field_field', { field: props.existingField.name })
		);

		return { field, tabs, currentTab, localType, save, saving, newRelations, isNew, title, collectionInfo };

		function useField() {
			const defaults = {
				id: null,
				collection: props.collection,
				field: null,
				datatype: null,
				unique: false,
				primary_key: false,
				auto_increment: false,
				default_value: null,
				note: null,
				signed: false,
				type: null,
				sort: null,
				interface: null,
				options: null,
				display: null,
				display_options: null,
				hidden_detail: false,
				hidden_browse: false,
				required: false,
				locked: false,
				translation: null,
				readonly: false,
				width: 'full',
				validation: null,
				group: null,
				length: null,
			};

			const field = ref<any>({ ...defaults });
			const localType = ref<LocalType | null>(null);

			watch(
				() => props.active,
				() => {
					if (!props.existingField) {
						field.value = { ...defaults };
						localType.value = null;
					}
				}
			);

			watch(
				() => props.existingField,
				(existingField: Field) => {
					if (existingField) {
						field.value = existingField;

						const type: Type = existingField.type;

						for (const [group, types] of Object.entries(localTypeGroups)) {
							if (types.includes(type)) {
								localType.value = group as LocalType;
								break;
							}
						}
					} else {
						field.value = { ...defaults };
						localType.value = null;
					}
				}
			);

			return { field, localType };
		}

		function useTabs() {
			const currentTab = ref(['field']);

			watch(
				() => props.active,
				() => {
					currentTab.value = ['field'];
				}
			);

			const tabs = computed(() => {
				const tabs = [
					{
						text: i18n.t('field_type'),
						value: 'field',
					},
					{
						text: i18n.t('interface'),
						value: 'interface',
					},
					{
						text: i18n.t('display'),
						value: 'display',
					},
					{
						text: i18n.t('schema'),
						value: 'schema',
					},
				];

				if (localType.value === 'relational') {
					tabs.splice(1, 0, {
						text: i18n.t('relationship'),
						value: 'relationship',
					});
				}

				return tabs;
			});

			return { currentTab, tabs };
		}

		function useSave() {
			const saving = ref(false);
			const saveError = ref(null);

			return { save, saving, saveError };

			async function save() {
				saving.value = true;

				try {
					if (field.value.id === null) {
						await fieldsStore.createField(props.collection, field.value);

						for (const relation of newRelations.value) {
							await createRelation(relation);
						}
					} else {
						if (field.value.hasOwnProperty('name')) {
							delete field.value.name;
						}

						await fieldsStore.updateField(
							props.existingField.collection,
							props.existingField.field,
							field.value
						);
					}
					emit('toggle', false);
				} catch (error) {
					saveError.value = error;
				} finally {
					saving.value = false;
				}
			}

			async function createRelation(relation: Partial<Relation>) {
				await api.post(`/relations`, relation);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.spacer {
	flex-grow: 1;
}

.content {
	::v-deep {
		.type-title {
			margin-bottom: 48px;
		}

		.type-label {
			margin-bottom: 8px;
		}
	}
}
</style>
