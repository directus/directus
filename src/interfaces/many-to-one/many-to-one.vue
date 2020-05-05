<template>
	<v-notice warning v-if="!relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<v-notice warning v-else-if="!displayTemplate">
		{{ $t('display_template_not_setup') }}
	</v-notice>
	<div class="many-to-one" v-else>
		<v-menu v-model="menuActive" attached close-on-content-click>
			<template #activator="{ active }">
				<v-skeleton-loader type="input" v-if="loadingCurrent" />
				<v-input
					:active="active"
					@click="onPreviewClick"
					v-else
					:placeholder="$t('select_an_item')"
				>
					<template #input v-if="currentItem">
						<div class="preview">
							<render-template
								:collection="collection"
								:item="currentItem"
								:template="displayTemplate"
							/>
						</div>
					</template>

					<template #append>
						<template v-if="currentItem">
							<v-icon
								name="open_in_new"
								class="edit"
								v-tooltip="$t('edit')"
								@click.stop="startEditing"
							/>
							<v-icon
								name="close"
								class="deselect"
								@click.stop="$emit('input', null)"
								v-tooltip="$t('deselect')"
							/>
						</template>
						<template v-else>
							<v-icon
								class="add"
								name="add"
								v-tooltip="$t('add_new_item')"
								@click.stop="startEditing"
							/>
							<v-icon class="expand" :class="{ active }" name="expand_more" />
						</template>
					</template>
				</v-input>
			</template>

			<v-list dense>
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
						:key="item[primaryKeyField.field]"
						:active="value === item[primaryKeyField.field]"
						@click="setCurrent(item)"
					>
						<v-list-item-content>
							<render-template
								:collection="collection"
								:template="displayTemplate"
								:item="item"
							/>
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<v-modal
			v-model="editModalActive"
			:title="$t('editing_in', { collection: relatedCollection.name })"
			persistent
		>
			<v-form
				:loading="editLoading"
				:initial-values="existingItem"
				:collection="relatedCollection.collection"
				v-model="edits"
			/>

			<template #footer>
				<v-button @click="cancelEditing" secondary>{{ $t('cancel') }}</v-button>
				<v-button @click="stopEditing">{{ $t('save') }}</v-button>
			</template>
		</v-modal>

		<v-modal v-model="selectModalActive" :title="$t('select_item')" no-padding>
			<layout-tabular
				class="layout"
				:collection="relatedCollection.collection"
				:selection="selection"
				@update:selection="onSelect"
				select-mode
			/>

			<template #footer>
				<v-button @click="cancelSelecting" secondary>{{ $t('cancel') }}</v-button>
				<v-button @click="stopSelecting">{{ $t('save') }}</v-button>
			</template>
		</v-modal>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs, watch, PropType } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/relations';
import useCollection from '@/composables/use-collection';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import useCollectionsStore from '@/stores/collections';

/**
 * @NOTE
 *
 * The value of a many to one can be one of three things: A primary key (number/string), a nested
 * object of edits (including primary key = editing existing) or an object with new values (no
 * primary key)
 */

export default defineComponent({
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
	},
	setup(props, { emit }) {
		const { collection } = toRefs(props);

		const projectsStore = useProjectsStore();
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();

		const { relation, relatedCollection } = useRelation();
		const { usesMenu, menuActive } = useMenu();
		const { info: collectionInfo, primaryKeyField } = useCollection(collection);
		const { displayTemplate, onPreviewClick, requiredFields } = usePreview();
		const { totalCount, loading: itemsLoading, fetchItems, items } = useItems();
		const { setCurrent, currentItem, loading: loadingCurrent } = useCurrent();
		const {
			edits,
			editModalActive,
			startEditing,
			stopEditing,
			loading: editLoading,
			error: editError,
			existingItem,
			cancelEditing,
		} = useEdit();

		const {
			startSelecting,
			stopSelecting,
			cancelSelecting,
			active: selectModalActive,
			selection,
			onSelect,
		} = useSelectionModal();

		return {
			cancelEditing,
			cancelSelecting,
			collectionInfo,
			currentItem,
			displayTemplate,
			editError,
			editLoading,
			editModalActive,
			edits,
			existingItem,
			items,
			itemsLoading,
			loadingCurrent,
			menuActive,
			onPreviewClick,
			primaryKeyField,
			relatedCollection,
			relation,
			selection,
			selectModalActive,
			setCurrent,
			startEditing,
			startSelecting,
			stopEditing,
			stopSelecting,
			totalCount,
			onSelect,
			useMenu,
		};

		function useCurrent() {
			const currentItem = ref<Record<string, any>>(null);
			const loading = ref(false);
			const error = ref(null);

			watch(
				() => props.value,
				(newValue) => {
					// When the newly configured value is a primitive, assume it's the primary key
					// of the item and fetch it from the API to render the preview
					if (
						newValue !== null &&
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						newValue !== currentItem.value?.[primaryKeyField.value!.field] &&
						(typeof newValue === 'string' || typeof newValue === 'number')
					) {
						fetchCurrent();
					}

					// If the value isn't a primary key, the current value will be set by the editing
					// handlers in useEdit()

					if (newValue === null) {
						currentItem.value = null;
					}
				}
			);

			return { setCurrent, currentItem, loading };

			function setCurrent(item: Record<string, any>) {
				currentItem.value = item;
				emit('input', item[primaryKeyField.value.field]);
			}

			async function fetchCurrent() {
				const { currentProjectKey } = projectsStore.state;
				loading.value = true;

				const fields = requiredFields.value || [];

				if (fields.includes(primaryKeyField.value.field) === false) {
					fields.push(primaryKeyField.value.field);
				}

				try {
					const response = await api.get(
						`/${currentProjectKey}/items/${relatedCollection.value.collection}/${props.value}`,
						{
							params: {
								fields: fields,
							},
						}
					);

					currentItem.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useItems() {
			const totalCount = ref<number>(null);

			const items = ref<Record<string, any>[]>(null);
			const loading = ref(false);
			const error = ref(null);

			watch(relatedCollection, () => {
				fetchTotalCount();
				items.value = null;
			});

			return { totalCount, fetchItems, items, loading };

			async function fetchItems() {
				if (items.value !== null) return;

				const { currentProjectKey } = projectsStore.state;
				loading.value = true;

				const fields = requiredFields.value || [];

				if (fields.includes(primaryKeyField.value.field) === false) {
					fields.push(primaryKeyField.value.field);
				}

				try {
					const response = await api.get(
						`/${currentProjectKey}/items/${relatedCollection.value.collection}`,
						{
							params: {
								fields: fields,
								limit: -1,
							},
						}
					);

					items.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			async function fetchTotalCount() {
				const { currentProjectKey } = projectsStore.state;
				const response = await api.get(
					`/${currentProjectKey}/items/${relatedCollection.value.collection}`,
					{
						params: {
							limit: 0,
							meta: 'total_count',
						},
					}
				);

				totalCount.value = response.data.meta.total_count;
			}
		}

		function useEdit() {
			const loading = ref(false);
			const error = ref(null);
			const existingItem = ref<any>(null);

			const edits = ref<any>(null);
			const editModalActive = ref(false);

			return {
				edits,
				editModalActive,
				startEditing,
				stopEditing,
				loading,
				error,
				existingItem,
				cancelEditing,
			};

			async function startEditing() {
				editModalActive.value = true;
				loading.value = true;

				// If the current value is an object, it's the previously created changes to the item
				if (props.value && typeof props.value === 'object') {
					edits.value = props.value;
				}
				// if not, it's the primary key of the existing item (fresh load). It's important for
				// us to stage the existing ID back up in the object of edits, otherwise the API will
				// treat the edits as a creation of a new item instead of editing the values of an
				// existing one
				else if (
					props.value &&
					(typeof props.value === 'number' || typeof props.value === 'string')
				) {
					edits.value = {
						[primaryKeyField.value.field]: props.value,
					};
				}

				// If the current item has a primary key, it means that it's an existing item we're
				// about to edit. In that case, we want to fetch the whole existing item, so we can
				// render the full form inline
				if (currentItem.value?.hasOwnProperty(primaryKeyField.value.field)) {
					loading.value = true;

					const { currentProjectKey } = projectsStore.state;

					try {
						const response = await api.get(
							`/${currentProjectKey}/items/${relatedCollection.value.collection}/${
								currentItem.value[primaryKeyField.value.field]
							}`
						);
						existingItem.value = response.data.data;
					} catch (err) {
						error.value = err;
					} finally {
						loading.value = false;
					}
				}
				// When the current item doesn't have a primary key, it means it's new. In that case
				// we don't have to bother fetching anything, as all the edits are already stored
				// in current item
				else {
					loading.value = false;
				}
			}

			function cancelEditing() {
				editModalActive.value = false;
				error.value = null;
				loading.value = false;
				existingItem.value = null;
				edits.value = null;
			}

			function stopEditing() {
				emit('input', edits.value);

				// Merging the previously fetched existing current item makes sure we don't remove
				// any fields in the preview that wasn't edited, but still used in the preview
				currentItem.value = {
					...currentItem.value,
					...edits.value,
				};

				cancelEditing();
			}
		}

		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			const relatedCollection = computed(() => {
				if (!relation.value) return null;
				return collectionsStore.getCollection(relation.value.collection_one);
			});

			return { relation, relatedCollection };
		}

		function useMenu() {
			const menuActive = ref(false);
			const usesMenu = computed(() => {
				if (props.selectMode === 'modal') return false;
				if (props.selectMode === 'dropdown') return true;

				// auto
				if (totalCount.value && totalCount.value > 100) return false;
				return true;
			});

			return { menuActive, usesMenu };
		}

		function usePreview() {
			const displayTemplate = computed(() => {
				if (props.template !== null) return props.template;
				return collectionInfo.value?.display_template;
			});

			const requiredFields = computed(() => {
				if (!displayTemplate.value) return null;
				return getFieldsFromTemplate(displayTemplate.value);
			});

			return { onPreviewClick, displayTemplate, requiredFields };

			function onPreviewClick() {
				if (usesMenu.value === true) {
					const newActive = !menuActive.value;
					menuActive.value = newActive;
					if (newActive === true) fetchItems();
				} else {
					startSelecting();
				}
			}
		}

		function useSelectionModal() {
			const active = ref(false);
			const selection = ref<any[]>([]);

			return { active, selection, onSelect, startSelecting, stopSelecting, cancelSelecting };

			function onSelect(newSelection: any[]) {
				if (newSelection.length > 0) {
					selection.value = [newSelection[newSelection.length - 1]];
				} else {
					selection.value = [];
				}
			}

			function startSelecting() {
				active.value = true;

				if (props.value) {
					if (
						typeof props.value === 'object' &&
						props.value.hasOwnProperty(primaryKeyField.value.field)
					) {
						selection.value = [props.value[primaryKeyField.value.field]];
					} else if (typeof props.value === 'string' || typeof props.value === 'number') {
						selection.value = [props.value];
					}
				}
			}

			function stopSelecting() {
				if (!selection.value[0]) {
					emit('input', null);
				} else {
					emit('input', selection.value[0]);
				}
				cancelSelecting();
			}

			function cancelSelecting() {
				active.value = false;
				selection.value = [];
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.many-to-one {
	position: relative;
}

.v-skeleton-loader {
	top: 0;
	left: 0;
}

.preview {
	display: block;
	flex-grow: 1;
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

.layout {
	--layout-offset-top: 0px;
}
</style>
