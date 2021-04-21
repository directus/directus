<template>
	<v-notice type="warning" v-if="!relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<v-notice type="warning" v-else-if="!displayTemplate">
		{{ $t('display_template_not_setup') }}
	</v-notice>
	<div class="many-to-one" v-else>
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
							<v-icon name="open_in_new" class="edit" v-tooltip="$t('edit')" @click.stop="editModalActive = true" />
							<v-icon name="close" class="deselect" @click.stop="$emit('input', null)" v-tooltip="$t('deselect')" />
						</template>
						<template v-else>
							<v-icon class="add" name="add" v-tooltip="$t('create_item')" @click.stop="editModalActive = true" />
							<v-icon class="expand" :class="{ active }" name="expand_more" />
						</template>
					</template>
				</v-input>
			</template>

			<v-list>
				<template v-if="itemsLoading">
					<v-list-item v-for="n in 10" :key="`loader-${n}`">
						<v-list-item-content>
							<v-skeleton-loader type="text" />
						</v-list-item-content>
					</v-list-item>
				</template>

				<template v-else>
					<v-list-item
						v-for="item in items"
						:key="item[relatedPrimaryKeyField.field]"
						:active="value === item[relatedPrimaryKeyField.field]"
						@click="setCurrent(item)"
					>
						<v-list-item-content>
							<render-template :collection="relatedCollection.collection" :template="displayTemplate" :item="item" />
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<drawer-item
			v-if="!disabled"
			:active.sync="editModalActive"
			:collection="relatedCollection.collection"
			:primary-key="currentPrimaryKey"
			:edits="edits"
			:circular-field="relation.one_field"
			@input="stageEdits"
		/>

		<drawer-collection
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relatedCollection.collection"
			:selection="selection"
			@input="stageSelection"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs, watch, PropType } from '@vue/composition-api';
import { useCollectionsStore, useRelationsStore } from '@/stores/';
import useCollection from '@/composables/use-collection';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import api from '@/api';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { unexpectedError } from '@/utils/unexpected-error';

/**
 * @NOTE
 *
 * The value of a many to one can be one of three things: A primary key (number/string), a nested
 * object of edits (including primary key = editing existing) or an object with new values (no
 * primary key)
 */

export default defineComponent({
	components: { DrawerItem, DrawerCollection },
	props: {
		value: {
			type: [Number, String, Object],
			default: null,
		},
		collection: {
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
		selectMode: {
			type: String as PropType<'auto' | 'dropdown' | 'modal'>,
			default: 'auto',
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
		const { usesMenu, menuActive } = useMenu();
		const { info: collectionInfo } = useCollection(collection);
		const { selection, stageSelection, selectModalActive } = useSelection();
		const { displayTemplate, onPreviewClick, requiredFields } = usePreview();
		const { totalCount, loading: itemsLoading, fetchItems, items } = useItems();

		const { setCurrent, currentItem, loading: loadingCurrent, currentPrimaryKey } = useCurrent();

		const { edits, stageEdits } = useEdits();

		const editModalActive = ref(false);

		return {
			collectionInfo,
			currentItem,
			displayTemplate,
			items,
			itemsLoading,
			loadingCurrent,
			menuActive,
			onPreviewClick,
			relatedCollection,
			relation,
			selection,
			selectModalActive,
			setCurrent,
			totalCount,
			stageSelection,
			useMenu,
			currentPrimaryKey,
			edits,
			stageEdits,
			editModalActive,
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

				if (typeof props.value === 'object' && props.value.hasOwnProperty(relatedPrimaryKeyField.value.field)) {
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

				try {
					const endpoint = relatedCollection.value.collection.startsWith('directus_')
						? `/${relatedCollection.value.collection.substring(9)}/${props.value}`
						: `/items/${relatedCollection.value.collection}/${encodeURIComponent(props.value)}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
						},
					});

					currentItem.value = response.data.data;
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
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

		function useMenu() {
			const menuActive = ref(false);
			const usesMenu = computed(() => {
				if (props.selectMode === 'modal') return false;
				if (props.selectMode === 'dropdown') return true;

				// auto
				if (totalCount.value !== null && totalCount.value <= 100) return true;
				return false;
			});

			return { menuActive, usesMenu };
		}

		function usePreview() {
			const displayTemplate = computed(() => {
				if (props.template !== null) return props.template;
				return collectionInfo.value?.meta?.display_template || `{{ ${relatedPrimaryKeyField.value.field} }}`;
			});

			const requiredFields = computed(() => {
				if (!displayTemplate.value) return null;
				return getFieldsFromTemplate(displayTemplate.value);
			});

			return { onPreviewClick, displayTemplate, requiredFields };

			function onPreviewClick() {
				if (props.disabled) return;

				if (usesMenu.value === true) {
					const newActive = !menuActive.value;
					menuActive.value = newActive;
					if (newActive === true) fetchItems();
				} else {
					selectModalActive.value = true;
				}
			}
		}

		function useSelection() {
			const selectModalActive = ref(false);

			const selection = computed<(number | string)[]>(() => {
				if (!props.value) return [];

				if (typeof props.value === 'object' && props.value.hasOwnProperty(relatedPrimaryKeyField.value.field)) {
					return [props.value[relatedPrimaryKeyField.value.field]];
				}

				if (typeof props.value === 'string' || typeof props.value === 'number') {
					return [props.value];
				}

				return [];
			});

			return { selection, stageSelection, selectModalActive };

			function stageSelection(newSelection: (number | string)[]) {
				if (newSelection.length === 0) {
					emit('input', null);
				} else {
					emit('input', newSelection[0]);
				}
			}
		}

		function useEdits() {
			const edits = computed(() => {
				// If the current value isn't a primitive, it means we've already staged some changes
				// This ensures we continue on those changes instead of starting over
				if (props.value && typeof props.value === 'object') {
					return props.value;
				}

				return {};
			});

			return { edits, stageEdits };

			function stageEdits(newEdits: Record<string, any>) {
				// Make sure we stage the primary key if it exists. This is needed to have the API
				// update the existing item instead of create a new one
				if (currentPrimaryKey.value && currentPrimaryKey.value !== '+') {
					emit('input', {
						[relatedPrimaryKeyField.value.field]: currentPrimaryKey.value,
						...newEdits,
					});
				} else {
					if (
						newEdits.hasOwnProperty(relatedPrimaryKeyField.value.field) &&
						newEdits[relatedPrimaryKeyField.value.field] === '+'
					) {
						delete newEdits[relatedPrimaryKeyField.value.field];
					}

					emit('input', newEdits);
				}

				currentItem.value = {
					...currentItem.value,
					...newEdits,
				};
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.many-to-one {
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
