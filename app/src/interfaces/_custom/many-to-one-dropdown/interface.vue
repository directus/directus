<template>
	<v-notice type="warning" v-if="!relation || parentField == null || childrenField == null">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<v-notice type="warning" v-else-if="!displayTemplate">
		{{ $t('display_template_not_setup') }}
	</v-notice>
	<div class="many-to-one-custom-dropdown" v-else>
		<v-menu v-model="menuActive" attached :disabled="disabled">
			<template #activator="{ active }">
				<v-skeleton-loader type="input" v-if="loadingCurrent" />
				<v-input
					:active="active"
					@click="onPreviewClick"
					v-else
					:placeholder="$t('select_an_item')"
					:disabled="disabled"
				>
					<template #input v-if="currentItem">
						<div class="preview">
							<render-template
								:collection="relatedCollection.collection"
								:item="currentItem"
								:template="displayTemplate"
							/>
						</div>
					</template>

					<template #append v-if="!disabled">
						<template v-if="currentItem">
							<v-icon name="close" class="deselect" @click.stop="emitValue(null)" v-tooltip="$t('deselect')" />
							<v-icon class="expand" :class="{ active }" name="expand_more" />
						</template>
						<template v-else>
							<v-icon class="expand" :class="{ active }" name="expand_more" />
						</template>
					</template>
				</v-input>
			</template>

			<v-list>
				<template v-if="itemsLoading">
					<v-list-item v-for="n in 5" :key="`loader-${n}`">
						<v-list-item-content>
							<v-skeleton-loader type="text" />
						</v-list-item-content>
					</v-list-item>
				</template>

				<template v-else-if="computedItems && computedItems.tree">
					<!-- Dummy item, otherwise the v-list does not initialize correctly -->
					<v-list-item v-show="false">Item 1</v-list-item>
					<recursive-list-item
						v-for="item in computedItems.tree"
						:key="item.id"
						:collection="relatedCollection.collection"
						:children-field="childrenField"
						:parent-field="parentField"
						:item="item"
						:children="item.children"
						:template="displayTemplate"
						:currentItem="currentItem"
						@input="emitValue"
						:active="true"
						:computedItems="computedItems"
					/>
				</template>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
import api from '@/api';
import useCollection from '@/composables/use-collection';
import { defineComponent, computed, ref, toRefs, watch, onMounted } from '@vue/composition-api';
import { useCollectionsStore, useRelationsStore } from '@/stores/';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { unexpectedError } from '@/utils/unexpected-error';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';

import RecursiveListItem from './recursive-list-item.vue';
import { generateNormalized } from './methods';

export default defineComponent({
	components: {
		RecursiveListItem,
	},
	props: {
		value: {
			type: [Number, String, Object],
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
		parentField: {
			type: String,
			required: true,
		},
		childrenField: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { collection } = toRefs(props);

		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();
		const { info: collectionInfo } = useCollection(collection);
		const { usesMenu, menuActive } = useMenu();
		const { displayTemplate, onPreviewClick, requiredFields } = usePreview();
		const { totalCount, loading: itemsLoading, fetchItems, items } = useItems();

		const { setCurrent, currentItem, loading: loadingCurrent, currentPrimaryKey } = useCurrent();

		const computedItems = computed(() => {
			if (items.value) return generateNormalized(items.value, 'id', props.parentField, props.childrenField);
			return null;
		});

		function emitValue(value: boolean | null) {
			emit('input', value);
			menuActive.value = false;
		}

		return {
			emitValue,
			computedItems,
			collectionInfo,
			currentItem,
			displayTemplate,
			items,
			itemsLoading,
			loadingCurrent,
			onPreviewClick,
			relatedCollection,
			menuActive,
			usesMenu,
			relation,
			setCurrent,
			totalCount,
			currentPrimaryKey,
			relatedPrimaryKeyField,
		};

		function useCurrent() {
			const currentItem = ref<Record<string, any> | null>(null);
			const loading = ref(false);

			watch(
				() => props.value,
				(newValue) => {
					// When the newly configured value is a primitive, assume it's the primary key
					// of the item and fetch it from the API to render the preview
					if (
						newValue !== null &&
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						newValue !== currentItem.value?.[relatedPrimaryKeyField.value!.field] &&
						(typeof newValue === 'string' || typeof newValue === 'number')
					) {
						fetchCurrent();
					}

					// If the value isn't a primary key, the current value will be set by the editing
					// handlers in useEdit()

					if (newValue === null) {
						currentItem.value = null;
					}
				},
				{ immediate: true }
			);

			const currentPrimaryKey = computed<string | number>(() => {
				if (!currentItem.value) return '+';
				if (!props.value) return '+';

				if (typeof props.value === 'number' || typeof props.value === 'string') {
					return props.value;
				}

				if (typeof props.value === 'object' && relatedPrimaryKeyField.value.field in props.value) {
					return props.value[relatedPrimaryKeyField.value.field];
				}

				return '+';
			});

			return { setCurrent, currentItem, loading, currentPrimaryKey };

			function setCurrent(item: Record<string, any>) {
				currentItem.value = item;
				emit('input', item[relatedPrimaryKeyField.value.field]);
			}

			async function fetchCurrent() {
				loading.value = true;

				const fields = requiredFields.value || [];

				if (fields.includes(relatedPrimaryKeyField.value.field) === false) {
					fields.push(relatedPrimaryKeyField.value.field);
				}

				fields.push(props.parentField);
				fields.push(props.childrenField);

				try {
					const endpoint = relatedCollection.value.collection.startsWith('directus_')
						? `/${relatedCollection.value.collection.substring(9)}/${props.value}`
						: `/items/${relatedCollection.value.collection}/${encodeURIComponent(props.value)}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
						},
					});

					const item = response.data.data;

					currentItem.value = item;
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useMenu() {
			const menuActive = ref(false);
			const usesMenu = computed(() => {
				return true;
			});

			return { menuActive, usesMenu };
		}

		function useItems() {
			const totalCount = ref<number | null>(null);

			const items = ref<Record<string, any>[] | null>(null);
			const loading = ref(false);

			watch(relatedCollection, () => {
				fetchTotalCount();
				items.value = null;
			});

			return { totalCount, fetchItems, items, loading };

			async function fetchItems() {
				if (items.value !== null) return;

				loading.value = true;

				const fields = requiredFields.value || [];

				if (fields.includes(relatedPrimaryKeyField.value.field) === false) {
					fields.push(relatedPrimaryKeyField.value.field);
				}

				try {
					const endpoint = relatedCollection.value.collection.startsWith('directus_')
						? `/${relatedCollection.value.collection.substring(9)}`
						: `/items/${relatedCollection.value.collection}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
							limit: -1,
							sort: 'sort',
						},
					});

					items.value = response.data.data;
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}

			async function fetchTotalCount() {
				const endpoint = relatedCollection.value.collection.startsWith('directus_')
					? `/${relatedCollection.value.collection.substring(9)}`
					: `/items/${relatedCollection.value.collection}`;

				const response = await api.get(endpoint, {
					params: {
						limit: 0,
						meta: 'total_count',
					},
				});

				totalCount.value = response.data.meta.total_count;
			}
		}

		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			const relatedCollection = computed(() => {
				return collectionsStore.getCollection(relation.value.one_collection)!;
			});

			const { primaryKeyField: relatedPrimaryKeyField } = useCollection(relatedCollection.value.collection);

			return { relation, relatedCollection, relatedPrimaryKeyField };
		}

		function usePreview() {
			const displayTemplate = computed(() => {
				if (props.template !== null) return props.template;
				return collectionInfo.value?.meta?.display_template || `{{ ${relatedPrimaryKeyField.value.field} }}`;
			});

			const requiredFields = computed(() => {
				if (!displayTemplate.value) return null;
				return adjustFieldsForDisplays(
					getFieldsFromTemplate(displayTemplate.value),
					relatedCollection.value.collection
				);
			});

			return { onPreviewClick, displayTemplate, requiredFields };

			function onPreviewClick() {
				if (props.disabled) return;

				if (usesMenu.value === true) {
					const newActive = !menuActive.value;
					menuActive.value = newActive;
					if (newActive === true) fetchItems();
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.many-to-one-custom-dropdown {
	position: relative;

	::v-deep .v-input .append {
		display: flex;
	}
}

.v-skeleton-loader {
	top: 0;
	left: 0;
}

.preview {
	display: block;
	flex-grow: 1;
	height: calc(100% - 16px);
	overflow: hidden;
}

.expand {
	transition: transform var(--fast) var(--transition);

	&.active {
		transform: scaleY(-1);
	}
}

.edit {
	margin-right: 4px;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}

.add:hover {
	--v-icon-color: var(--primary);
}

.deselect:hover {
	--v-icon-color: var(--danger);
}
</style>
