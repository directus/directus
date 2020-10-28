<template>
	<v-notice type="warning" v-if="!junction || !relation || !junction.junction_field">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="one-to-many" v-else>
		<v-menu attached :disabled="disabled">
			<template #activator="{ activate }">
				<v-input
					:placeholder="placeholder || $t('interfaces.tags.add_tags')"
					:disabled="disabled"
					@keydown="onKeyDown"
					@keyup="onType"
					@focus="activate"
					:value="localInput"
				>
					<template #prepend><v-icon v-if="iconLeft" :name="iconLeft" /></template>
					<template #append><v-icon v-if="iconRight" :name="iconRight" /></template>
				</v-input>
			</template>
			<v-list>
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
import { defineComponent, ref, PropType, toRefs } from '@vue/composition-api';

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

		// from tags
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
		alphabetize: {
			type: Boolean,
			default: false,
		},
		iconLeft: {
			type: String,
			default: null,
		},
		iconRight: {
			type: String,
			default: 'local_offer',
		},
	},
	setup(props, { emit }) {
		const { value, collection, field } = toRefs(props);
		const typeTimer = ref<any>(null);
		const localInput = ref<string>('');
		const suggestedItems = ref<object[]>([]);
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

		return {
			junction,
			relation,
			onKeyDown,
			onType,
			suggestedItems,
			localInput,
			items,
			displayItem,
			addItemSuggestion,
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
			localInput.value = '';
		}

		function addItemByReferencingValue(value: string) {
			findByKeyword(value).then((item) => {
				if (item) {
					stageSelection([item[relationInfo.value.relationPkField]]);
				} else {
					stageEdits({
						[relationInfo.value.junctionField as string]: {
							[props.referencingField]: value,
						},
					});
				}
			});
		}

		function updateSuggestions(keyword: string) {
			findSuggestions(keyword)
				.then((itemsFound) =>
					itemsFound.filter((item) => {
						return !items.value.find(
							(i) =>
								i[relationInfo.value.junctionField][relationInfo.value.relationPkField] ===
								item[relationInfo.value.junctionPkField]
						);
					})
				)
				.then((itemsFound) => {
					suggestedItems.value = itemsFound;
				});
		}

		async function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Tab' && suggestedItems.value.length > 0) {
				event.preventDefault();
				localInput.value = displayItem(suggestedItems.value[0]);
			}
		}

		async function onType(event: KeyboardEvent) {
			const value = (event.target as HTMLInputElement).value.trim();

			if (!value) return;

			if (event.key === 'Enter') {
				event.preventDefault();
				addItemByReferencingValue(value);
				localInput.value = '';
			} else {
				if (typeTimer.value) clearTimeout(typeTimer.value);
				typeTimer.value = setTimeout(async () => {
					typeTimer.value = null;
					localInput.value = value;
					updateSuggestions(value);
				}, 500);
			}
		}

		async function findSuggestions(keyword: string) {
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, {
				params: {
					limit: 25,
					fields: [relationInfo.value.relationPkField, props.referencingField],
					filter: {
						[props.referencingField]: {
							_contains: keyword,
						},
					},
				},
			});
			return response?.data.data as Record<string, any>[];
		}

		async function findByKeyword(keyword: string) {
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, {
				params: {
					single: 1,
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
