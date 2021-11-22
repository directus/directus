<template>
	<v-notice v-if="!relationInfo.relationCollection" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!displayTemplate" type="warning">
		{{ t('display_template_not_setup') }}
	</v-notice>
	<div v-else class="many-to-one">
		<v-menu v-model="menuActive" attached :disabled="disabled">
			<template #activator="{ active }">
				<v-skeleton-loader v-if="loadingCurrent" type="input" />
				<v-input
					v-else
					:active="active"
					clickable
					:placeholder="t('select_an_item')"
					:disabled="disabled"
					@click="onPreviewClick"
				>
					<template v-if="currentItem" #input>
						<div class="preview">
							<render-template
								:collection="relationInfo.relationCollection"
								:item="currentItem"
								:template="displayTemplate"
							/>
						</div>
					</template>

					<template v-if="!disabled" #append>
						<template v-if="currentItem">
							<v-icon v-tooltip="t('edit')" name="open_in_new" class="edit" @click.stop="editModalActive = true" />
							<v-icon v-tooltip="t('deselect')" name="close" class="deselect" @click.stop="$emit('input', null)" />
						</template>
						<template v-else>
							<v-icon v-tooltip="t('create_item')" class="add" name="add" @click.stop="editModalActive = true" />
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
						:key="item[relationInfo.relationPkField]"
						:active="value === item[relationInfo.relationPkField]"
						clickable
						@click="setCurrent(item)"
					>
						<v-list-item-content>
							<render-template :collection="relationInfo.relationCollection" :template="displayTemplate" :item="item" />
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<drawer-item
			v-if="!disabled"
			v-model:active="editModalActive"
			:collection="relationInfo.relationCollection"
			:primary-key="currentPrimaryKey"
			:edits="edits"
			:circular-field="relationInfo.junctionField"
			@input="stageEdits"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relationCollection"
			:selection="selectedPrimaryKeys"
			@input="stageSelection"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref, toRefs, watch, PropType } from 'vue';
import { useCollection } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import api from '@/api';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { unexpectedError } from '@/utils/unexpected-error';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useRelationInfo } from '@/composables/use-relation-info';
import { useSelection } from '@/composables/use-selection';

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
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { collection } = toRefs(props);

		const { usesMenu, menuActive } = useMenu();
		const { info: collectionInfo } = useCollection(collection);
		const { relationInfo } = useRelationInfo({ collection: props.collection, field: props.field });
		const { displayTemplate, onPreviewClick, requiredFields } = usePreview();
		const { totalCount, loading: itemsLoading, fetchItems, items } = useItems();

		const { setCurrent, currentItem, initialItem, loading: loadingCurrent, currentPrimaryKey } = useCurrent();

		const { selectedPrimaryKeys, stageSelection, selectModalActive } = useSelection({
			initialItems: ref([initialItem]),
			items: ref([currentItem]),
			relationInfo,
			emit: emitter,
		});

		const { edits, stageEdits } = useEdits();

		const editModalActive = ref(false);

		return {
			t,
			collectionInfo,
			currentItem,
			displayTemplate,
			items,
			itemsLoading,
			loadingCurrent,
			menuActive,
			onPreviewClick,
			relationInfo,
			selectedPrimaryKeys,
			selectModalActive,
			setCurrent,
			totalCount,
			stageSelection,
			useMenu,
			currentPrimaryKey,
			edits,
			stageEdits,
			editModalActive,
		};

		function emitter(newVal: any | null) {
			emit('input', newVal);
		}

		function useCurrent() {
			const initialItem = ref<Record<string, any> | null>(null);
			const currentItem = ref<Record<string, any> | null>(null);
			const loading = ref(false);

			watch(
				() => props.value,
				(newValue) => {
					// When the newly configured value is a primitive, assume it's the primary key
					// of the item and fetch it from the API to render the preview
					if (
						newValue !== null &&
						newValue !== currentItem.value?.[relationInfo.value.relationPkField] &&
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
				if (!relationInfo.value.relationPkField) return '+';

				if (typeof props.value === 'number' || typeof props.value === 'string') {
					return props.value!;
				}

				if (typeof props.value === 'object' && relationInfo.value.relationPkField in (props.value ?? {})) {
					return props.value?.[relationInfo.value.relationPkField] ?? '+';
				}

				return '+';
			});

			return { setCurrent, initialItem, currentItem, loading, currentPrimaryKey };

			function setCurrent(item: Record<string, any>) {
				if (!relationInfo.value.relationPkField) return;
				currentItem.value = item;
				emit('input', item[relationInfo.value.relationPkField]);
			}

			async function fetchCurrent() {
				if (!relationInfo.value.relationPkField || !relationInfo.value.relationCollection) return;
				if (typeof props.value === 'object') return;

				loading.value = true;

				const fields = requiredFields.value || [];

				if (fields.includes(relationInfo.value.relationPkField) === false) {
					fields.push(relationInfo.value.relationPkField);
				}

				try {
					const endpoint = relationInfo.value.relationCollection.startsWith('directus_')
						? `/${relationInfo.value.relationCollection.substring(9)}/${props.value}`
						: `/items/${relationInfo.value.relationCollection}/${encodeURIComponent(props.value!)}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
						},
					});

					currentItem.value = response.data.data;

					if (!initialItem.value) initialItem.value = response.data.data;
				} catch (err: any) {
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

			watch(
				() => relationInfo.value.relationCollection,
				() => {
					fetchTotalCount();
					items.value = null;
				}
			);

			return { totalCount, fetchItems, items, loading };

			async function fetchItems() {
				if (items.value !== null) return;
				if (!relationInfo.value.relationCollection || !relationInfo.value.relationPkField) return;

				loading.value = true;

				const fields = requiredFields.value || [];

				if (fields.includes(relationInfo.value.relationPkField) === false) {
					fields.push(relationInfo.value.relationPkField);
				}

				try {
					const endpoint = relationInfo.value.relationCollection.startsWith('directus_')
						? `/${relationInfo.value.relationCollection.substring(9)}`
						: `/items/${relationInfo.value.relationCollection}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
							limit: -1,
						},
					});

					items.value = response.data.data;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}

			async function fetchTotalCount() {
				if (!relationInfo.value.relationCollection) return;

				const endpoint = relationInfo.value.relationCollection.startsWith('directus_')
					? `/${relationInfo.value.relationCollection.substring(9)}`
					: `/items/${relationInfo.value.relationCollection}`;

				const response = await api.get(endpoint, {
					params: {
						limit: 0,
						meta: 'total_count',
					},
				});

				totalCount.value = response.data.meta.total_count;
			}
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
				return collectionInfo.value?.meta?.display_template || `{{ ${relationInfo.value.relationPkField || ''} }}`;
			});

			const requiredFields = computed(() => {
				if (!displayTemplate.value || !relationInfo.value.relationCollection) return null;

				return adjustFieldsForDisplays(
					getFieldsFromTemplate(displayTemplate.value),
					relationInfo.value.relationCollection
				);
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
				if (!relationInfo.value.relationPkField) return;

				// Make sure we stage the primary key if it exists. This is needed to have the API
				// update the existing item instead of create a new one
				if (currentPrimaryKey.value && currentPrimaryKey.value !== '+') {
					emit('input', {
						[relationInfo.value.relationPkField]: currentPrimaryKey.value,
						...newEdits,
					});
				} else {
					if (relationInfo.value.relationPkField in newEdits && newEdits[relationInfo.value.relationPkField] === '+') {
						delete newEdits[relationInfo.value.relationPkField];
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

	:deep(.v-input .append) {
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
