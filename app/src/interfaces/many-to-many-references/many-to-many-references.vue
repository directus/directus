<template>
	<v-notice type="warning" v-if="!junction || !relation || !junction.junction_field">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="many-to-many-references" v-else>
		<v-menu
			v-model="menuActive"
			:close-on-click="true"
			:close-on-content-click="closeOnSelect"
			attached
			:disabled="disabled"
		>
			<template #activator>
				<v-input
					v-model="localInput"
					:placeholder="placeholder"
					:disabled="disabled"
					@keydown="onKeyDown"
					@focus="activateMenu"
				>
					<template #prepend>
						<v-icon v-if="iconLeft" :name="iconLeft" />
					</template>

					<template #append>
						<v-icon v-if="iconRight" :name="iconRight" />
					</template>
				</v-input>
			</template>
			<v-list>
				<v-list-item v-if="allowCustom && localInput" @click="addItemFromCurrentInput">
					<v-list-item-content class="add-custom">
						{{ $t('interfaces.many-to-many-references.new-item-with', { argument: localInput }) }}
					</v-list-item-content>
				</v-list-item>
				<template v-if="suggestedItems.length">
					<v-list-item
						v-for="(item, index) in suggestedItems"
						:key="item[relation.one_primary]"
						@click="() => addItemFromSuggestion(item)"
						:active="index === suggestedItemsSelected"
					>
						<v-list-item-content>
							<render-template :template="displayTemplate" :item="item" :collection="relation.one_collection" />
						</v-list-item-content>
					</v-list-item>
				</template>
				<template v-else-if="!allowCustom">
					<v-list-item class="no-items">
						{{ $t('no_items') }}
					</v-list-item>
				</template>
			</v-list>
		</v-menu>
		<div class="tags" v-if="sortedItems.length > 0">
			<v-chip
				v-for="(item, index) in sortedItems"
				:disabled="disabled"
				:key="index"
				class="tag"
				small
				label
				@click="() => deleteItem(item)"
			>
				<render-template
					:template="displayTemplate"
					:item="item[junction.junction_field]"
					:collection="relation.one_collection"
				/>
			</v-chip>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, toRefs, watch, computed } from '@vue/composition-api';
import useActions from '../many-to-many/use-actions';
import useRelation from '../many-to-many/use-relation';
import usePreview from '../many-to-many/use-preview';
import useEdit from '../many-to-many/use-edit';
import useSelection from '../many-to-many/use-selection';
import api from '@/api';
import { debounce } from 'lodash';

export default defineComponent({
	props: {
		value: {
			type: Array as PropType<(number | string | Record<string, any>)[] | null>,
			default: null,
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		allowCustom: {
			type: Boolean,
			default: false,
		},
		referencingField: {
			type: String,
			default: '',
		},
		closeOnSelect: {
			type: Boolean,
			default: false,
		},
		displayTemplate: {
			type: String,
			default: '',
		},
		alphabetize: {
			type: Boolean,
			default: false,
		},
		iconLeft: {
			type: String,
			default: 'local_offer',
		},
		iconRight: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const { value, collection, field, referencingField } = toRefs(props);
		const localInput = ref<string>('');
		const suggestedItems = ref<object[]>([]);
		const suggestedItemsSelected = ref<number | null>(null);
		const menuActive = ref(false);

		const { junction, relation, relationInfo } = useRelation(collection, field);

		const displayTemplateFields = props.displayTemplate
			? (props.displayTemplate.match(/{{([^}]+)}}/g) || []).map((field) => field.replace(/[{}]/g, ''))
			: [props.referencingField];

		const fields = ref<string[]>(displayTemplateFields.map((field) => relationInfo.value.junctionField + '.' + field));

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const { items } = usePreview(
			value,
			fields,
			referencingField,
			relationInfo,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const { stageEdits } = useEdit(value, relationInfo, emitter);

		const { stageSelection } = useSelection(value, items, relationInfo, emitter);

		const sortedItems = computed(() => {
			if (!props.alphabetize) return items.value;

			return items.value.sort((a, b) => {
				return a[relationInfo.value.junctionField][referencingField.value].localeCompare(
					b[relationInfo.value.junctionField][referencingField.value]
				);
			});
		});

		watch(suggestedItems, () => activateMenu());

		watch(
			localInput,
			debounce((newValue, oldValue) => {
				if (newValue === oldValue) return;

				updateSuggestions(newValue);
			}, 500)
		);

		return {
			menuActive,
			activateMenu,
			junction,
			relation,
			localInput,
			onKeyDown,
			suggestedItems,
			suggestedItemsSelected,
			sortedItems,
			addItemFromCurrentInput,
			addItemFromSuggestion,
			deleteItem,
		};

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		function activateMenu() {
			menuActive.value = suggestedItems.value.length > 0 || !!localInput.value.trim();
		}

		async function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				menuActive.value = false;
			} else if (event.key === 'Enter') {
				event.preventDefault();
				if (suggestedItemsSelected.value !== null && suggestedItems.value[suggestedItemsSelected.value]) {
					menuActive.value = false;
					addItemFromSuggestion(suggestedItems.value[suggestedItemsSelected.value]);
					localInput.value = '';
				} else if (props.allowCustom) {
					menuActive.value = false;
					addItemFromCurrentInput();
					localInput.value = '';
				}
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				menuActive.value = true;

				if (suggestedItems.value.length < 1) return;

				if (
					suggestedItemsSelected.value === null ||
					suggestedItemsSelected.value < 1 ||
					!suggestedItems.value[suggestedItemsSelected.value]
				) {
					suggestedItemsSelected.value = suggestedItems.value.length - 1;
				} else {
					suggestedItemsSelected.value--;
				}
			} else if (event.key === 'ArrowDown' || event.key === 'Tab') {
				event.preventDefault();
				menuActive.value = true;

				if (suggestedItems.value.length < 1) return;

				if (
					suggestedItemsSelected.value === null ||
					suggestedItemsSelected.value >= suggestedItems.value.length - 1 ||
					!suggestedItems.value[suggestedItemsSelected.value]
				) {
					suggestedItemsSelected.value = 0;
				} else {
					suggestedItemsSelected.value++;
				}
			}
		}

		function itemValueExists(value: string) {
			return items.value.find((item) => item[relationInfo.value.junctionField][props.referencingField] === value);
		}

		function addItemFromSuggestion(item: any) {
			stageSelection([item[relationInfo.value.relationPkField]]);
		}

		function addItemFromCurrentInput() {
			const value = localInput.value.trim();
			if (!value || itemValueExists(value)) {
				return;
			}

			findByKeyword(value).then((item) => {
				if (item) {
					stageSelection([item[relationInfo.value.relationPkField]]);
				} else if (props.allowCustom) {
					stageEdits({
						[relationInfo.value.junctionField as string]: {
							[props.referencingField]: value,
						},
					});
				}
			});
		}

		async function updateSuggestions(keyword: string) {
			suggestedItemsSelected.value = null;

			if (keyword.length < 1) {
				suggestedItems.value = [];
				return;
			}
			const currentIds = items.value
				.map((i) => i[relationInfo.value.junctionField][relationInfo.value.relationPkField])
				.filter((i) => !!i);

			const query = {
				params: {
					limit: 10,
					fields: [relationInfo.value.relationPkField, ...displayTemplateFields],
					filter: {
						[props.referencingField]: {
							_contains: keyword,
						},
						[relationInfo.value.relationPkField]: {
							_nin: currentIds.join(','),
						},
					},
					sort: props.referencingField,
				},
			};

			const response = await api.get(`items/${relationInfo.value.relationCollection}`, query);
			if (response?.data.data && Array.isArray(response.data.data)) {
				suggestedItems.value = response.data.data;
			} else {
				suggestedItems.value = [];
			}
		}

		async function findByKeyword(keyword: string) {
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, {
				params: {
					single: true,
					fields: [relationInfo.value.relationPkField, ...displayTemplateFields],
					filter: {
						[props.referencingField]: {
							_eq: keyword,
						},
					},
				},
			});
			return response?.data.data as Record<string, any>;
		}
	},
});
</script>

<style lang="scss" scoped>
.add-custom {
	font-style: oblique;
}

.no-items {
	color: var(--foreground-subdued);
}

.tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-start;
	padding: 4px 0 0;

	.tag {
		margin-top: 8px;
		margin-right: 8px;
	}

	.v-chip {
		--v-chip-background-color-hover: var(--danger);
		--v-chip-close-color: var(--v-chip-background-color);
		--v-chip-close-color-hover: var(--white);

		&:hover {
			--v-chip-close-color: var(--white);
			::v-deep .chip-content .close-outline .close:hover {
				--v-icon-color: var(--danger);
			}
		}
	}
}
</style>
