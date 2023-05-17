<template>
	<div class="table">
		<v-notice v-if="!value || value.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<v-table
			v-if="value && value.length > 0"
			v-model:headers="headers"
			:items="tableItems"
			show-resize
			fixed-header
			:row-height="tableRowHeight"
			:disabled="disabled"
			@click:row="rowClick"
		/>

		<v-button v-if="showAddNew" class="add-new" @click="addNew">Add</v-button>

		<v-drawer
			:model-value="drawerOpen"
			:title="headerPlaceholder"
			persistent
			@update:model-value="checkDiscard()"
			@cancel="checkDiscard()"
		>
			<template #actions>
				<v-button
					v-tooltip.bottom="t('delete_field')"
					:disabled="isNewItem"
					icon
					rounded
					kind="danger"
					@click="removeItem(active)"
				>
					<v-icon name="delete" />
				</v-button>
				<v-button v-tooltip.bottom="t('save')" icon rounded @click="saveItem(active)">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-item-content">
				<v-form
					:disabled="disabled"
					:fields="fieldsWithNames"
					:model-value="activeItem"
					autofocus
					primary-key="+"
					@update:model-value="trackEdits($event)"
				/>
			</div>
		</v-drawer>

		<v-dialog v-model="confirmDiscard" @esc="confirmDiscard = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave()">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmDiscard = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed, ref } from 'vue';
import { Field } from '@directus/types';
import { i18n } from '@/lang';
import { isEqual } from 'lodash';
import { hideDragImage } from '@/utils/hide-drag-image';
import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		limit: {
			type: Number,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		headerPlaceholder: {
			type: String,
			default: i18n.global.t('empty_item'),
		},
		tableSpacing: {
			type: String as PropType<'compact' | 'cozy' | 'comfortable'>,
			required: true,
		},
		collection: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const isNewItem = ref(false);
		const edits = ref({});
		const confirmDiscard = ref(false);
		const active = ref<number | null>(null);
		const drawerOpen = computed(() => active.value !== null);

		const headers = (props.fields || []).map((field) => ({
			value: field.field,
			text: field.meta.display_name || formatTitle(field.name),
			width: field.meta.width,
		}));

		const tableItems = computed({
			get() {
				return props.value || [];
			},
		});
		const activeItem = computed(() => (active.value !== null ? edits.value : null));

		const showAddNew = computed(() => {
			if (props.disabled) return false;
			if (props.value === null) return true;
			if (props.limit === null) return true;
			if (Array.isArray(props.value) && props.value.length < props.limit) return true;
			return false;
		});

		const tableRowHeight = computed<number>(() => {
			switch (props.tableSpacing) {
				case 'compact':
					return 32;
				case 'cozy':
					return 48;
				case 'comfortable':
					return 64;
				default:
					return 32;
			}
		});

		const defaults = computed(() => {
			const values: Record<string, any> = {};

			for (const field of props.fields) {
				if (field.schema?.default_value !== undefined && field.schema?.default_value !== null) {
					values[field.field!] = field.schema.default_value;
				}
			}

			return values;
		});

		const fieldsWithNames = computed(() =>
			props.fields?.map((field) => {
				return {
					...field,
					name: formatTitle(field.name ?? field.field!),
				};
			})
		);

		return {
			t,
			headers,
			tableItems,
			tableRowHeight,
			updateValues,
			removeItem,
			addNew,
			showAddNew,
			hideDragImage,
			active,
			drawerOpen,
			activeItem,
			closeDrawer,
			onSort,
			defaults,
			fieldsWithNames,
			isNewItem,
			edits,
			confirmDiscard,
			rowClick,
			saveItem,
			trackEdits,
			checkDiscard,
			discardAndLeave,
		};

		function getItemIndex(item) {
			for (let i = 0; i < props.value.length; i++) {
				if (isEqual(item, props.value[i])) return i;
			}
			return -1;
		}

		function rowClick(row) {
			isNewItem.value = false;

			edits.value = { ...row.item };
			active.value = getItemIndex(row.item);
		}

		function saveItem(index: number) {
			isNewItem.value = false;

			updateValues(index, edits.value);
			closeDrawer();
		}

		function trackEdits(updatedValues: any) {
			const combinedValues = Object.assign({}, defaults.value, updatedValues);
			Object.assign(edits.value, combinedValues);
		}

		function checkDiscard() {
			if (active.value !== null && !isEqual(edits.value, props.value[active.value])) {
				confirmDiscard.value = true;
			} else {
				closeDrawer();
			}
		}

		function discardAndLeave() {
			closeDrawer();
			confirmDiscard.value = false;
		}

		function updateValues(index: number, updatedValues: any) {
			emitValue(
				props.value.map((item: any, i: number) => {
					if (i === index) {
						return updatedValues;
					}
					return item;
				})
			);
		}

		function removeItem(active: number) {
			if (edits.value) {
				emitValue(props.value.filter((item, index) => index !== active));
			} else {
				emitValue(null);
			}
			closeDrawer();
		}

		function addNew() {
			isNewItem.value = true;

			const newDefaults: any = {};

			props.fields.forEach((field) => {
				newDefaults[field.field!] = field.schema?.default_value;
			});

			if (props.value !== null) {
				emitValue([...props.value, newDefaults]);
			} else {
				emitValue([newDefaults]);
			}

			edits.value = { ...newDefaults };
			active.value = (props.value || []).length;
		}

		function emitValue(value: null | any[]) {
			if (!value || value.length === 0) {
				return emit('input', null);
			}

			return emit('input', value);
		}

		function onSort(sortedItems: any[]) {
			if (sortedItems === null || sortedItems.length === 0) {
				return emit('input', null);
			}

			return emit('input', sortedItems);
		}

		function closeDrawer() {
			if (isNewItem.value) {
				emitValue(props.value.slice(0, -1));
			}

			edits.value = {};
			active.value = null;
		}
	},
});
</script>

<style>
.tabs {
	--v-tab-color: var(--foreground-normal);
	--v-tab-color-active: var(--green);
	--v-tab-background-color: var(--background-page);
	--v-tab-background-color-active: var(--background-page);
}
</style>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 4px;
}

.v-list {
	--v-list-padding: 0 0 4px;
}

.v-list-item {
	display: flex;
	cursor: pointer;
}

.drag-handle {
	cursor: grap;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.add-new {
	margin-top: 8px;
}
</style>
