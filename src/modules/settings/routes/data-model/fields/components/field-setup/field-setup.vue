<template>
	<v-modal :active="active" :title="modalTitle" persistent>
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
				<v-tab
					v-for="tab in tabs"
					:key="tab.value"
					:disabled="tab.disabled"
					:value="tab.value"
				>
					{{ tab.text }}
				</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items v-model="currentTab" class="content">
			<field-setup-field :is-new="isNew" :field.sync="field" :type.sync="localType" />
			<field-setup-relationship v-if="needsRelationalSetup" :is-new="isNew" />
			<field-setup-interface
				:is-new="isNew"
				:interface.sync="interfaceKey"
				:options.sync="interfaceOptions"
			/>
			<field-setup-display
				:is-new="isNew"
				:display.sync="displayKey"
				:options.sync="displayOptions"
			/>
			<field-setup-advanced
				:is-new="isNew"
				:existing-field="existingField"
				:edits.sync="edits"
			/>
		</v-tabs-items>

		<template #footer>
			<v-button secondary outlined @click="$emit('toggle', false)">
				{{ $t('cancel') }}
			</v-button>
			<div class="spacer" />
			<v-button secondary @click="previous" :disabled="previousDisabled">
				{{ $t('previous') }}
			</v-button>
			<v-button
				@click="next"
				:disabled="nextDisabled"
				v-if="currentTab[0] !== tabs.length - 1"
			>
				{{ $t('next') }}
			</v-button>
			<v-button
				@click="save"
				:disabled="saveDisabled"
				v-if="currentTab[0] === tabs.length - 1"
				:loading="saving"
			>
				{{ $t('finish_setup') }}
			</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from '@vue/composition-api';
import { Field } from '@/stores/fields/types';
import FieldSetupField from './field-setup-field.vue';
import FieldSetupRelationship from './field-setup-relationship.vue';
import FieldSetupInterface from './field-setup-interface.vue';
import FieldSetupDisplay from './field-setup-display.vue';
import FieldSetupAdvanced from './field-setup-advanced.vue';
import { i18n } from '@/lang';
import { TranslateResult } from 'vue-i18n';
import { isEmpty } from '@/utils/is-empty';
import { useFieldsStore } from '@/stores/fields/';

export default defineComponent({
	components: {
		FieldSetupField,
		FieldSetupRelationship,
		FieldSetupInterface,
		FieldSetupDisplay,
		FieldSetupAdvanced,
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

		const isNew = computed(() => props.existingField === null);

		const edits = ref<Partial<Field>>({});

		watch(
			() => props.active,
			() => (edits.value = {})
		);

		const modalTitle = computed<TranslateResult>(() => {
			if (isNew.value === true) {
				return i18n.t('creating_field');
			}

			return i18n.t('editing_field', { field: props.existingField.name });
		});

		const { field, localType } = useFieldSetup();
		const { needsRelationalSetup, relationships } = useRelationshipSetup();
		const { interfaceKey, interfaceOptions } = useInterfaceSetup();
		const { displayKey, displayOptions } = useDisplaySetup();

		const { tabs, currentTab, previousDisabled, nextDisabled, previous, next } = useTabs();
		const { save, saveDisabled, saveError, saving } = useSave();

		return {
			currentTab,
			displayKey,
			displayOptions,
			edits,
			field,
			interfaceKey,
			interfaceOptions,
			isNew,
			localType,
			modalTitle,
			needsRelationalSetup,
			next,
			nextDisabled,
			previous,
			previousDisabled,
			relationships,
			save,
			saveDisabled,
			saveError,
			saving,
			tabs,
		};

		function useTabs() {
			const fieldIncomplete = computed<boolean>(() => {
				return isEmpty(field.value) || isEmpty(localType.value);
			});

			const relationshipIncomplete = computed<boolean>(() => {
				return false;
			});

			const interfaceIncomplete = computed<boolean>(() => {
				/** @NOTE this is where we can check for required fields */
				return isEmpty(interfaceKey.value);
			});

			const displayIncomplete = computed<boolean>(() => {
				/** @NOTE this is where we can check for required fields */
				return isEmpty(displayKey.value);
			});

			const tabs = computed(() => {
				const tabs = [
					{
						text: i18n.t('field_setup'),
						value: 'field',
					},
					{
						text: i18n.t('interface_setup'),
						disabled: isNew.value && fieldIncomplete.value,
						value: 'interface',
					},
					{
						text: i18n.t('display_setup'),
						disabled: isNew.value && interfaceIncomplete.value,
						value: 'display',
					},
					{
						text: i18n.t('advanced_options'),
						disabled: isNew.value && displayIncomplete.value,
						value: 'advanced',
					},
				];

				if (needsRelationalSetup.value === true) {
					tabs.splice(1, 0, {
						text: i18n.t('relationship_setup'),
						disabled: isNew.value && fieldIncomplete.value,
						value: 'relationship',
					});

					tabs[2].disabled = isNew.value && relationshipIncomplete.value;
					tabs[3].disabled = isNew.value && interfaceIncomplete.value;
					tabs[4].disabled = isNew.value && displayIncomplete.value;
				}

				return tabs;
			});

			const currentTab = ref(['field']);

			const currentTabIndex = computed(() =>
				tabs.value.findIndex((tab) => tab.value === currentTab.value[0])
			);

			watch(
				() => props.active,
				() => (currentTab.value = ['field'])
			);

			const previousDisabled = computed(() => {
				return currentTabIndex.value === 0;
			});

			const nextDisabled = computed(() => {
				const nextTabIndex = currentTabIndex.value + 1;
				const nextTabIsDisabled = tabs.value[nextTabIndex]?.disabled === true;

				return nextTabIsDisabled;
			});

			return { tabs, currentTab, previous, next, nextDisabled, previousDisabled };

			function previous() {
				const previousTabValue = tabs.value[currentTabIndex.value - 1].value;
				currentTab.value = [previousTabValue];
			}

			function next() {
				const nextTabValue = tabs.value[currentTabIndex.value + 1].value;
				currentTab.value = [nextTabValue];
			}
		}

		function useFieldSetup() {
			const field = computed({
				get() {
					return edits.value.field || props.existingField?.field;
				},
				set(newField: string) {
					edits.value = {
						...edits.value,
						field: newField,
					};
				},
			});

			const localType = ref<string>(null);

			watch(
				() => props.existingField,
				(existingField: Field) => {
					if (existingField) {
						if (existingField.type === 'file') {
							localType.value = 'file';
						} else if (existingField.type === 'files') {
							localType.value = 'files';
						} else if (['o2m', 'm2o'].includes(existingField.type)) {
							localType.value = 'relational';
						} else {
							localType.value = 'standard';
						}
					} else {
						localType.value = null;
					}
				}
			);

			return { field, localType };
		}

		function useRelationshipSetup() {
			const needsRelationalSetup = computed(
				() => localType.value && ['relational', 'file', 'files'].includes(localType.value)
			);

			const relationships: any[] = [];

			return { needsRelationalSetup, relationships };
		}

		function useInterfaceSetup() {
			const interfaceKey = computed({
				get() {
					return edits.value.interface || props.existingField?.interface;
				},
				set(newInterface: string | null) {
					edits.value = {
						...edits.value,
						interface: newInterface,
					};
				},
			});

			const interfaceOptions = computed({
				get() {
					return edits.value.options || props.existingField?.options;
				},

				set(newOptions: { [key: string]: any } | null) {
					edits.value = {
						...edits.value,
						options: newOptions,
					};
				},
			});

			return { interfaceKey, interfaceOptions };
		}

		function useDisplaySetup() {
			const displayKey = computed({
				get() {
					return edits.value.display || props.existingField?.display;
				},
				set(newDisplay: string | null) {
					edits.value = {
						...edits.value,
						display: newDisplay,
					};
				},
			});

			const displayOptions = computed({
				get() {
					return edits.value.display_options || props.existingField?.display_options;
				},

				set(newOptions: { [key: string]: any } | null) {
					edits.value = {
						...edits.value,
						display_options: newOptions,
					};
				},
			});

			return { displayKey, displayOptions };
		}

		function useSave() {
			const saveDisabled = computed(() => {
				return edits.value === null || Object.keys(edits.value).length === 0;
			});

			const saving = ref(false);
			const saveError = ref(null);

			return { save, saving, saveDisabled, saveError };

			async function save() {
				saving.value = true;

				try {
					if (isNew.value === true) {
						await fieldsStore.createField(props.collection, edits.value);
					} else {
						await fieldsStore.updateField(
							props.existingField.collection,
							props.existingField.field,
							edits.value
						);
					}

					emit('toggle', false);
				} catch (error) {
					console.log(error);
					saveError.value = error;
				}

				saving.value = false;
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
		.title {
			margin-bottom: 48px;
			font-weight: normal;
			font-size: 24px;
			font-style: normal;
			line-height: 29px;
			letter-spacing: -0.8px;
		}

		.label {
			margin-bottom: 8px;
			font-weight: 600;
			font-size: 16px;
			font-style: normal;
			line-height: 19px;
			letter-spacing: -0.32px;
		}
	}
}
</style>
