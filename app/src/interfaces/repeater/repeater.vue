<template>
	<div class="repeater">
		<repeater-list
			:value="value"
			:active="active"
			@input="onSort"
			@active="active = $event"
			@delete="removeItem"
			:limit="limit"
			:disabled="disabled"
			:placeholder="headerPlaceholder"
			:template="template"
		></repeater-list>
		<v-button @click="addNew" class="add-new" v-if="showAddNew">
			<v-icon name="add" />
			{{ addLabel }}
		</v-button>

		<v-drawer
			:active="drawerOpen"
			@toggle="closeDrawer()"
			:title="title || headerPlaceholder"
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
import renderTemplate from '@/utils/render-template';
import hideDragImage from '@/utils/hide-drag-image';
import RepeaterList from './repeater-list.vue';

export default defineComponent({
	components: { Draggable, RepeaterList },
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
			default: i18n.t('add_a_new_item'),
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
	},
	setup(props, { emit }) {
		const active = ref<number | null>(null);
		const drawerOpen = computed(() => active.value !== null);
		const { value, template } = toRefs(props);

		const showAddNew = computed(() => {
			if (props.disabled) return false;
			if (props.value === null) return true;
			if (props.limit === null) return true;
			if (Array.isArray(props.value) && props.value.length < props.limit) return true;
			return false;
		});

		const activeItem = computed(() => (active.value !== null ? value.value[active.value] : null));

		const { displayValue: title } = renderTemplate(template, activeItem);

		return {
			updateValues,
			removeItem,
			addNew,
			showAddNew,
			hideDragImage,
			active,
			drawerOpen,
			title,
			activeItem,
			closeDrawer,
			onSort,
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

		function removeItem(row: number) {
			if (value.value) {
				const newValue = [...props.value];
				newValue.splice(row, 1);
				emitValue(newValue);
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
.row {
	background-color: var(--background-subdued);
	border: 2px solid var(--border-subdued);
	border-radius: var(--border-radius);

	& + .row {
		margin-top: 8px;
	}

	.repeater {
		.row {
			background-color: var(--background-page);
			border-color: var(--border-normal);
		}
	}
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.add-new {
	margin-top: 12px;
}
</style>
