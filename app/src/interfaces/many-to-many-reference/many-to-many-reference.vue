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
					@keydown="onKeyDown"
					@keyup="onType"
					@focus="onFocus"
					@blur="onBlur"
					:value="localInput"
				>
					<template #prepend><v-icon v-if="iconLeft" :name="iconLeft" /></template>
					<template #append><v-icon v-if="iconRight" :name="iconRight" /></template>
				</v-input>
			</template>
			<v-list v-if="suggestedItems.length">
				<v-list-item :key="item.id" v-for="item in suggestedItems" @click="() => addItemSuggestion(item)">
					<v-list-item-content>{{ displayItem(item) }}</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
		<div class="tags" v-if="items.length > 0">
			<v-chip
				v-for="(item, index) in items"
				:disabled="disabled"
				:key="index"
				class="tag"
				small
				label
				@click="() => deleteItem(item)"
			>
				{{ displayItem(item) }}
			</v-chip>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, toRefs, watch } from '@vue/composition-api';

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
			default: true,
		},
		referencingField: {
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
		const active = ref(false);
		const sortField = ref<string>(props.referencingField);

		const { junction, relation, relationInfo } = useRelation(collection, field);

		const fields = ref<string[]>([relationInfo.value.junctionField + '.' + props.referencingField]);

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

		watch(suggestedItems, () => {
			active.value = suggestedItems.value.length > 0;
		});

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
			items,
			displayItem,
			addItemSuggestion,
			addItemByReferencingValue,
			deleteItem,
			stageSelection,
		};

		function displayItem(item: any) {
			return (
				(item[relationInfo.value.junctionField as string]
					? item[relationInfo.value.junctionField as string][props.referencingField]
					: item[props.referencingField]) || ''
			);
		}

		function addItemSuggestion(item: any) {
			stageSelection([item[relationInfo.value.relationPkField]]);
		}

		function addItemByReferencingValue(value: string) {
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
				localInput.value = displayItem(suggestedItems.value[0]);
			}
		}

		async function onType(event: KeyboardEvent) {
			const value = (event.target as HTMLInputElement).value;

			if (typeTimer.value) clearTimeout(typeTimer.value);

			if (event.key === 'Enter') {
				event.preventDefault();
				addItemByReferencingValue(value.trim());
				localInput.value = '';
			} else {
				localInput.value = value;
				typeTimer.value = setTimeout(async () => {
					typeTimer.value = null;
					updateSuggestions(value.trim());
				}, 500);
			}
		}

		function onFocus() {
			active.value = suggestedItems.value.length > 0;
		}

		function onBlur() {
			active.value = false;
		}

		async function findSuggestions(keyword: string, excludeIds: string[] | number[]) {
			const query = {
				params: {
					limit: 10,
					fields: [relationInfo.value.relationPkField, props.referencingField],
					filter: {
						[props.referencingField]: {
							_contains: keyword,
						},
					},
				},
			};
			if (excludeIds.length) {
				query.params.filter[relationInfo.value.relationPkField] = {
					_nin: excludeIds,
				};
			}
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, query);
			return response?.data.data as Record<string, any>[];
		}

		async function findByKeyword(keyword: string) {
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, {
				params: {
					single: true,
					fields: [relationInfo.value.relationPkField, props.referencingField],
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
	padding: 4px 0px 0px;

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
