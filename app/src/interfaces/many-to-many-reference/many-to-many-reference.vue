<template>
	<v-notice type="warning" v-if="!junction || !relation || !junction.junction_field">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div v-else>
		<v-menu v-model="active" :close-on-click="false" :close-on-content-click="false" attached :disabled="disabled">
			<template #activator>
				<v-input
					:placeholder="placeholder"
					:disabled="disabled"
					:value="localInput"
					@keydown="onKeyDown"
					@keyup="onType"
					@focus="onFocus"
					@blur="onBlur"
				>
					<template #prepend><v-icon v-if="iconLeft" :name="iconLeft" /></template>
					<template #append><v-icon v-if="iconRight" :name="iconRight" /></template>
				</v-input>
			</template>
			<v-list v-if="suggestedItems.length">
				<v-list-item
					:key="item.id"
					v-for="(item, index) in suggestedItems"
					@click="() => addItemSuggestion(item)"
					:active="index === suggestedItemsSelected"
				>
					<v-list-item-content>
						<render-template
							:template="displayTemplate"
							:item="item"
							:collection="relation.one_collection"
						/>
					</v-list-item-content>
				</v-list-item>
			</v-list>
			<v-list v-else>
				<v-list-item>
					{{ $t('no_items') }}
				</v-list-item>
			</v-list>
		</v-menu>
		<div class="tags" v-if="items.length > 0">
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
		const { value, collection, field } = toRefs(props);
		const typeTimer = ref<any>(null);
		const localInput = ref<string>('');
		const suggestedItems = ref<object[]>([]);
		const suggestedItemsSelected = ref<number | null>(null);
		const active = ref(false);

		const displayTemplateFields = props.displayTemplate
			? (props.displayTemplate.match(/{{([^}]+)}}/g) || []).map((field) => field.replace(/[{}]/g, ''))
			: [props.referencingField];

		const fields = ref<string[]>(
			displayTemplateFields.map((field) => relationInfo.value.junctionField + '.' + field)
		);

		const { junction, relation, relationInfo } = useRelation(collection, field);
		const sortField = ref<string>(props.referencingField);

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const { items } = usePreview(
			value,
			fields,
			sortField,
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
				return a[relationInfo.value.junctionField][sortField.value].localeCompare(
					b[relationInfo.value.junctionField][sortField.value]
				);
			});
		});

		watch(suggestedItems, () => onFocus());

		watch(localInput, () => {
			if (!localInput.value.trim()) {
				active.value = false;
			}
		});

		return {
			active,
			junction,
			relation,
			onKeyDown,
			onType,
			onFocus,
			onBlur,
			suggestedItems,
			localInput,
			sortedItems,
			items,
			suggestedItemsSelected,
			addItemSuggestion,
			addItemByReferencingValue,
			deleteItem,
			stageSelection,
		};

		function addItemSuggestion(item: any) {
			stageSelection([item[relationInfo.value.relationPkField]]);
		}

		function itemValueExists(value: string) {
			return items.value.find((item) => item[relationInfo.value.junctionField][props.referencingField] === value);
		}

		function addItemByReferencingValue(value: string) {
			if (itemValueExists(value)) {
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

		function updateSuggestions(keyword: string) {
			suggestedItemsSelected.value = null;
			if (keyword.length < 1) {
				suggestedItems.value = [];
				return;
			}
			const currentIds = items.value
				.map((i) => i[relationInfo.value.junctionField][relationInfo.value.relationPkField])
				.filter((i) => !!i);
			findSuggestions(keyword, currentIds).then((itemsFound) => {
				suggestedItems.value = itemsFound;
			});
		}

		async function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Tab') {
				event.preventDefault();
			}
		}

		async function onType(event: KeyboardEvent) {
			const value = (event.target as HTMLInputElement).value;

			if (event.key === 'Escape') {
				event.preventDefault();
				active.value = false;
			} else if (event.key === 'Enter') {
				event.preventDefault();
				if (suggestedItemsSelected.value === null) {
					addItemByReferencingValue(value.trim());
				} else {
					if (suggestedItems.value[suggestedItemsSelected.value]) {
						addItemSuggestion(suggestedItems.value[suggestedItemsSelected.value]);
					} else {
						return;
					}
				}
				localInput.value = '';
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				if (suggestedItems.value.length < 1) {
					return;
				}
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
				if (suggestedItems.value.length < 1) {
					return;
				}
				if (
					suggestedItemsSelected.value === null ||
					suggestedItemsSelected.value >= suggestedItems.value.length - 1 ||
					!suggestedItems.value[suggestedItemsSelected.value]
				) {
					suggestedItemsSelected.value = 0;
				} else {
					suggestedItemsSelected.value++;
				}
			} else {
				if (localInput.value === value) {
					return;
				}
				localInput.value = value;
				if (typeTimer.value) {
					clearTimeout(typeTimer.value);
					typeTimer.value = null;
				}
				typeTimer.value = setTimeout(async () => {
					typeTimer.value = null;
					localInput.value = value;
					updateSuggestions(value.trim());
				}, 1000);
			}
		}

		function onFocus() {
			active.value = suggestedItems.value.length > 0 || (!props.allowCustom && !!localInput.value.trim());
		}

		function onBlur() {
			active.value = false;
		}

		async function findSuggestions(keyword: string, excludeIds: string[] | number[]) {
			const query = {
				params: {
					limit: 10,
					fields: [relationInfo.value.relationPkField, ...displayTemplateFields],
					filter: {
						[props.referencingField]: {
							_contains: keyword,
						},
						[relationInfo.value.relationPkField]: {
							_nin: excludeIds.join(','),
						},
					},
					sort: props.referencingField,
				},
			};
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, query);
			return response?.data.data as Record<string, any>[];
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
.tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-start;
	padding: 4px 0 0;

	.tag {
		margin-top: 8px;
		margin-right: 8px;

		.render-template {
			.null {
				display: none;
			}
		}
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
