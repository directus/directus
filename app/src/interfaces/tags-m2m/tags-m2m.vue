<template>
	<v-notice v-if="!relationInfo.junctionCollection || !relationInfo.relationCollection" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>

	<div v-else class="tags-m2m">
		<v-menu v-model="menuActive" :disabled="disabled" attached>
			<template #activator>
				<v-input
					v-model="localInput"
					:placeholder="
						placeholder ||
						t('interfaces.tags-m2m.add_placeholder', { collection: formatTitle(relationInfo.relationCollection) })
					"
					:disabled="disabled"
					@keydown="onInputKeyDown"
					@focus="menuActive = true"
				>
					<template v-if="iconLeft" #prepend>
						<v-icon v-if="iconLeft" :name="iconLeft" />
					</template>

					<template #append>
						<v-icon v-if="iconRight" :name="iconRight" />
					</template>
				</v-input>
			</template>

			<v-list v-if="showAddCustom || suggestedItems.length">
				<v-list-item v-if="showAddCustom" @click="addItemFromInput">
					<v-list-item-content class="add-custom">
						{{ t('interfaces.tags-m2m.new_item_with', { argument: localInput }) }}
					</v-list-item-content>
				</v-list-item>

				<template v-if="suggestedItems.length">
					<v-list-item
						v-for="(item, index) in suggestedItems"
						:key="item[relationInfo.relationPkField]"
						:active="index === suggestedItemsSelected"
						clickable
						@click="() => addItemFromSuggestion(item)"
					>
						<v-list-item-content>
							<render-template :template="template" :item="item" :collection="relationInfo.relationCollection" />
						</v-list-item-content>
					</v-list-item>
				</template>

				<template v-else-if="!allowCustom">
					<v-list-item class="no-items">
						{{ t('no_items') }}
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<div v-if="sortedItems.length > 0" class="tags">
			<v-chip
				v-for="(item, index) in sortedItems"
				:key="index"
				:disabled="disabled"
				class="tag"
				small
				label
				clickable
				@click="deleteItem(item)"
			>
				<render-template
					:template="template"
					:item="item[relationInfo.junctionField]"
					:collection="relationInfo.relationCollection"
				/>
			</v-chip>
		</div>
	</div>
</template>

<script lang="ts">
import api from '@/api';
import useRelation from '@/composables/use-m2m';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { parseFilter } from '@/utils/parse-filter';
import { Filter } from '@directus/shared/types';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import formatTitle from '@directus/format-title';
import { debounce, clone } from 'lodash';
import { computed, defineComponent, PropType, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import useActions from '../list-m2m/use-actions';
import usePreview from '../list-m2m/use-preview';

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
		sortField: {
			type: String,
			default: undefined,
		},
		sortDirection: {
			type: String,
			default: 'desc',
		},
		iconLeft: {
			type: String,
			default: null,
		},
		iconRight: {
			type: String,
			default: 'local_offer',
		},
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { value, collection, field } = toRefs(props);
		const { relationInfo } = useRelation(collection, field);

		const localInput = ref<string>('');
		const menuActive = ref<boolean>(false);

		const suggestedItems = ref<Record<string, any>[]>([]);
		const suggestedItemsSelected = ref<number | null>(null);

		const fields = computed(() => {
			if (!props.displayTemplate) return getFieldsFromTemplate(props.displayTemplate);

			return adjustFieldsForDisplays(
				getFieldsFromTemplate(props.displayTemplate),
				relationInfo.value.relationCollection
			);
		});

		const relationFields = computed(() => {
			return fields.value.map((field) => relationInfo.value.junctionField + '.' + field);
		});

		const template = props.displayTemplate || `{{${props.referencingField}}}`;

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const { items } = usePreview(
			value,
			relationFields,
			relationInfo,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const sortedItems = computed(() => {
			if (!relationInfo.value.junctionField) return items.value;

			const sorted = clone(items.value).sort(
				(a: Record<string, Record<string, any>>, b: Record<string, Record<string, any>>) => {
					const aVal: string = a[relationInfo.value.junctionField][props.referencingField];
					const bVal: string = b[relationInfo.value.junctionField][props.referencingField];

					return props.sortDirection === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
				}
			);

			return sorted;
		});

		const showAddCustom = computed(() => {
			return (
				props.allowCustom &&
				localInput.value?.trim() &&
				!itemValueAvailable(localInput.value) &&
				!itemValueStaged(localInput.value)
			);
		});

		watch(
			localInput,
			debounce((val) => {
				refreshSuggestions(val);
				menuActive.value = true;
			}, 300)
		);
		watch(
			() => props.value,
			debounce(() => refreshSuggestions(localInput.value), 300)
		);

		return {
			menuActive,
			showAddCustom,
			relationInfo,
			localInput,
			template,
			suggestedItems,
			suggestedItemsSelected,
			sortedItems,
			onInputKeyDown,
			addItemFromInput,
			addItemFromSuggestion,
			deleteItem,
			t,
			formatTitle,
		};

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		function addItemFromSuggestion(item: any) {
			menuActive.value = false;

			const { junctionField } = relationInfo.value;
			emitter([...(props.value || []), { [junctionField]: item }]);
		}

		async function addItemFromInput() {
			const value = localInput.value?.trim();
			if (!value || itemValueStaged(value)) return;

			try {
				const item = await findByKeyword(value);

				if (item) {
					addItemFromSuggestion(item);
				} else if (props.allowCustom) {
					addItemFromSuggestion({ [props.referencingField]: value });
				}
			} catch (err: any) {
				// eslint-disable-next-line no-console
				console.warn(err);
			}
		}

		function itemValueStaged(value: string): boolean {
			if (!value) return false;

			return !!items.value.find((item) => item[relationInfo.value.junctionField][props.referencingField] === value);
		}

		function itemValueAvailable(value: string): boolean {
			if (!value) return false;

			return !!suggestedItems.value.find((item) => item[props.referencingField] === value);
		}

		async function refreshSuggestions(keyword: string) {
			suggestedItemsSelected.value = null;

			if (!keyword || keyword.length < 1) {
				suggestedItems.value = [];
				return;
			}

			const filter = parseFilter(props.filter) || {};

			const currentIds = items.value
				.map((i) => i[relationInfo.value.junctionField][relationInfo.value.relationPkField])
				.filter((i) => !!i);

			const query = {
				params: {
					limit: 10,
					fields: [relationInfo.value.relationPkField, ...fields.value],
					search: keyword,
					filter: {
						...(props.referencingField && {
							[props.referencingField]: {
								_contains: keyword,
							},
						}),
						...(currentIds.length > 0 && {
							[relationInfo.value.relationPkField]: {
								_nin: currentIds.join(','),
							},
						}),
						...filter,
					},
					sort: props.sortField
						? props.sortDirection === 'desc'
							? `-${props.sortField}`
							: props.sortField
						: `-${relationInfo.value.relationPkField}`,
				},
			};

			const response = await api.get(`items/${relationInfo.value.relationCollection}`, query);
			if (response?.data?.data && Array.isArray(response.data.data)) {
				suggestedItems.value = response.data.data;
			} else {
				suggestedItems.value = [];
			}
		}

		async function findByKeyword(keyword: string): Promise<Record<string, any> | null> {
			const response = await api.get(`items/${relationInfo.value.relationCollection}`, {
				params: {
					limit: 1,
					fields: [relationInfo.value.relationPkField, ...fields.value],
					search: keyword,
					...(props.referencingField && {
						filter: {
							[props.referencingField]: {
								_contains: keyword,
							},
						},
					}),
				},
			});

			return response?.data?.data?.pop() || null;
		}

		async function onInputKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				menuActive.value = false;
				return;
			}

			if (event.key === 'Enter') {
				event.preventDefault();

				if (suggestedItemsSelected.value !== null && suggestedItems.value[suggestedItemsSelected.value]) {
					addItemFromSuggestion(suggestedItems.value[suggestedItemsSelected.value]);
					localInput.value = '';
				} else if (props.allowCustom) {
					addItemFromInput();
					localInput.value = '';
				}

				return;
			}

			if (event.key === 'ArrowUp') {
				event.preventDefault();

				if (suggestedItems.value.length < 1) return;

				// Select previous from the list, if on top, then go last.
				suggestedItemsSelected.value =
					suggestedItemsSelected.value === null ||
					suggestedItemsSelected.value < 1 ||
					!suggestedItems.value[suggestedItemsSelected.value]
						? suggestedItems.value.length - 1
						: suggestedItemsSelected.value - 1;

				return;
			}

			if (event.key === 'ArrowDown' || event.key === 'Tab') {
				event.preventDefault();

				if (suggestedItems.value.length < 1) return;

				// Select next from the list, if bottom, then go first.
				suggestedItemsSelected.value =
					suggestedItemsSelected.value === null ||
					suggestedItemsSelected.value >= suggestedItems.value.length - 1 ||
					!suggestedItems.value[suggestedItemsSelected.value]
						? 0
						: suggestedItemsSelected.value + 1;

				return;
			}
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
	padding: 4px 0px 0px;

	.tag {
		margin-top: 8px;
		margin-right: 8px;
	}

	.v-chip {
		--v-chip-background-color: var(--primary);
		--v-chip-color: var(--foreground-inverted);
		--v-chip-background-color-hover: var(--danger);
		--v-chip-close-color: var(--v-chip-background-color);
		--v-chip-close-color-hover: var(--white);

		transition: all var(--fast) var(--transition);

		&:hover {
			--v-chip-close-color: var(--white);

			:deep(.chip-content .close-outline .close:hover) {
				--v-icon-color: var(--danger);
			}
		}

		.render-template {
			padding-right: 0;
		}
	}
}
</style>
