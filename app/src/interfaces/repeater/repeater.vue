<template>
	<div class="repeater">
		<v-notice v-if="!value || value.length === 0">
			{{ $t('no_items') }}
		</v-notice>

		<v-list v-if="value && value.length > 0">
			<draggable :force-fallback="true" :value="value" @input="$emit('input', $event)" handler=".drag-handle">
				<v-list-item
					:dense="value.length > 4"
					v-for="(item, index) in value"
					:key="item.id"
					block
					@click="active = index"
				>
					<v-icon name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
					<render-template :fields="fields" :item="item" :template="templateWithDefaults" />
					<div class="spacer" />
					<v-icon v-if="!disabled" name="close" @click.stop="removeItem(item)" />
				</v-list-item>
			</draggable>
		</v-list>
		<v-button @click="addNew" class="add-new" v-if="showAddNew">
			{{ addLabel }}
		</v-button>

		<v-drawer
			:active="drawerOpen"
			@toggle="closeDrawer()"
			:title="displayValue || headerPlaceholder"
			persistent
			@cancel="closeDrawer()"
		>
			<template #actions>
				<v-button @click="closeDrawer()" icon rounded v-tooltip.bottom="$t('save')">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-item-content">
				<v-form
					:disabled="disabled"
					:fields="fields"
					:edits="activeItem"
					primary-key="+"
					@input="updateValues(active, $event)"
				/>
			</div>
		</v-drawer>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, toRefs } from '@vue/composition-api';
import { Field } from '@/types';
import Draggable from 'vuedraggable';
import i18n from '@/lang';
import { renderStringTemplate } from '@/utils/render-string-template';
import hideDragImage from '@/utils/hide-drag-image';

export default defineComponent({
	components: { Draggable },
	props: {
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		template: {
			type: String,
			default: null,
		},
		addLabel: {
			type: String,
			default: i18n.t('create_new'),
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
			default: i18n.t('empty_item'),
		},
		collection: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const active = ref<number | null>(null);
		const drawerOpen = computed(() => active.value !== null);
		const { value } = toRefs(props);

		const templateWithDefaults = computed(() => props.template || `{{${props.fields[0].field}}}`);

		const showAddNew = computed(() => {
			if (props.disabled) return false;
			if (props.value === null) return true;
			if (props.limit === null) return true;
			if (Array.isArray(props.value) && props.value.length < props.limit) return true;
			return false;
		});

		const activeItem = computed(() => (active.value !== null ? value.value[active.value] : null));

		const { displayValue } = renderStringTemplate(templateWithDefaults, activeItem);

		return {
			updateValues,
			removeItem,
			addNew,
			showAddNew,
			hideDragImage,
			active,
			drawerOpen,
			displayValue,
			activeItem,
			closeDrawer,
			onSort,
			templateWithDefaults,
		};

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

		function removeItem(item: Record<string, any>) {
			if (value.value) {
				emitValue(props.value.filter((i) => i !== item));
			} else {
				emitValue(null);
			}
		}

		function addNew() {
			const newDefaults: any = {};

			props.fields.forEach((field) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				newDefaults[field.field!] = field.schema?.default_value;
			});

			if (props.value !== null) {
				emitValue([...props.value, newDefaults]);
			} else {
				emitValue([newDefaults]);
			}

			active.value = (props.value || []).length;
		}

		function emitValue(value: null | any[]) {
			if (value === null || value.length === 0) {
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
			active.value = null;
		}
	},
});
</script>

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
