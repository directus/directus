<script setup lang="ts">
import { useCustomSelection, useCustomSelectionMultiple, type OtherValue } from '@directus/composables';
import { Placement } from '@popperjs/core';
import { debounce, get, isArray } from 'lodash';
import { computed, Ref, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SelectListItemGroup from './select-list-item-group.vue';
import SelectListItem from './select-list-item.vue';
import { Option } from './types';

type ItemsRaw = (string | any)[];
type InputValue = string[] | string | number | null;

const props = withDefaults(
	defineProps<{
		/** The items that should be selectable */
		items: ItemsRaw;
		/** Which key in items is used to display the text */
		itemText?: string;
		/** Which key in items is used to model the active state */
		itemValue?: string;
		/** Which key in items is used to show an icon */
		itemIcon?: string | null;
		/** Which key in items is used to show an icon color */
		itemColor?: string | null;
		/** Which font family to use for checkbox item label */
		itemLabelFontFamily?: string;
		/** Which key in items is used to model the disabled state */
		itemDisabled?: string;
		/** Which key in items is used to model the selectable state */
		itemSelectable?: string;
		/** Which key in items is used to render the children */
		itemChildren?: string;
		/** Which items should be shown as selected, depending on their value */
		modelValue?: InputValue;
		/** Allow to select multiple values */
		multiple?: boolean;
		/** Allow to select the parent of a group */
		groupSelectable?: boolean;
		/** Require a minimum selection of at least one element */
		mandatory?: boolean;
		/** Text that is displayed when no items are selected */
		placeholder?: string | null;
		/** Spreads the select element to it's maximal width */
		fullWidth?: boolean;
		/** Disables any interaction */
		disabled?: boolean;
		/** Allow to deselect all currently selected items */
		showDeselect?: boolean;
		/** Allow to enter custom values */
		allowOther?: boolean;
		/** Closes the dropdown after an items has been selected  */
		closeOnContentClick?: boolean;
		/** Renders the element inline, good for seamless selections */
		inline?: boolean;
		label?: boolean;
		/** Translation strings to replace items naming */
		allItemsTranslation?: string;
		itemCountTranslation?: string;
		/** Limits the amount of items inside the preview */
		multiplePreviewThreshold?: number;
		/** The direction the menu should open */
		placement?: Placement;
		menuFullHeight?: boolean;
	}>(),
	{
		itemText: 'text',
		itemValue: 'value',
		itemIcon: null,
		itemDisabled: 'disabled',
		itemSelectable: 'selectable',
		itemChildren: 'children',
		modelValue: null,
		mandatory: true,
		placeholder: null,
		fullWidth: true,
		closeOnContentClick: true,
		multiplePreviewThreshold: 3,
		placement: 'bottom',
	},
);

const emit = defineEmits(['update:modelValue', 'group-toggle']);

const { t } = useI18n();

const { internalItems, internalItemsCount, internalSearch } = useItems();
const { displayValue } = useDisplayValue();
const { modelValue } = toRefs(props);

const { otherValue, usesOtherValue } = useCustomSelection(modelValue as Ref<string>, internalItems, (value) =>
	emit('update:modelValue', value),
);

const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(
	modelValue as Ref<string[]>,
	internalItems,
	(value) => emit('update:modelValue', value),
);

const search = ref<string | null>(null);

watch(
	search,
	debounce((val: string | null) => {
		internalSearch.value = val;
	}, 250),
);

function onBlurCustomInput(otherVal: OtherValue) {
	return (otherVal.value === null || otherVal.value?.length === 0) && setOtherValue(otherVal.key, null);
}

function useItems() {
	const internalSearch = ref<string | null>(null);

	const internalItems = computed(() => {
		const parseItem = (item: Record<string, any> | string): Option => {
			if (typeof item === 'string') {
				return {
					text: item,
					value: item,
					hidden: internalSearch.value ? !filterItem(item) : false,
				};
			}

			if (item.divider === true) return { value: null, divider: true };

			const text = get(item, props.itemText);
			const value = get(item, props.itemValue);
			const children = get(item, props.itemChildren) ? get(item, props.itemChildren).map(parseItem) : null;

			return {
				text,
				value,
				icon: props.itemIcon ? get(item, props.itemIcon) : undefined,
				color: props.itemColor ? get(item, props.itemColor) : undefined,
				disabled: get(item, props.itemDisabled),
				selectable: get(item, props.itemSelectable),
				children: children
					? children.filter((childItem: Record<string, any>) =>
							filterItem(childItem.text, childItem.value, childItem.children),
						)
					: children,
				hidden: internalSearch.value ? !filterItem(text, value, item.children) : false,
			};
		};

		const filterItem = (
			text: string | undefined,
			value?: string | number | null,
			children?: Record<string, any>[] | null,
		): boolean => {
			if (!internalSearch.value) return true;

			const searchValue = internalSearch.value.toLowerCase();

			return children
				? isMatchingCurrentItem(text, value, searchValue) ||
						children.some((childItem: Record<string, any>) =>
							filterItem(get(childItem, props.itemText), get(childItem, props.itemValue), childItem.children),
						)
				: isMatchingCurrentItem(text, value, searchValue);

			function isMatchingCurrentItem(
				text: string | undefined,
				value: string | number | null | undefined,
				searchValue: string,
			): boolean {
				return (
					(text ? String(text).toLowerCase().includes(searchValue) : false) ||
					(value ? String(value).toLowerCase().includes(searchValue) : false)
				);
			}
		};

		return props.items.map(parseItem);
	});

	const internalItemsCount = computed<number>(() => {
		const countItems = (items: Option[]): number => {
			const count = items.reduce((acc, item): number => {
				if (item?.children) {
					acc += countItems(item.children);
				}

				return acc + 1;
			}, 0);

			return count;
		};

		return countItems(props.items);
	});

	return { internalItems, internalItemsCount, internalSearch };
}

function useDisplayValue() {
	const displayValue = computed(() => {
		if (Array.isArray(props.modelValue)) {
			if (props.modelValue.length < props.multiplePreviewThreshold) {
				return {
					text: props.modelValue
						.map((value) => {
							return getItemForValue(value)?.text || value;
						})
						.join(', '),
				};
			} else {
				const itemCount = internalItems.value.length + otherValues.value.length;
				const selectionCount = props.modelValue.length;

				if (itemCount === selectionCount) {
					return { text: t(props.allItemsTranslation ?? 'all_items') };
				} else {
					return { text: t(props.itemCountTranslation ?? 'item_count', selectionCount) };
				}
			}
		}

		if (props.multiple) {
			return { text: t(props.itemCountTranslation ?? 'item_count', 0) };
		}

		const item = getItemForValue(props.modelValue);
		return { text: item?.text || props.modelValue, icon: item?.icon, color: item?.color };
	});

	return { displayValue };

	function getItemForValue(value: string | number | null) {
		return findValue(internalItems.value);

		function findValue(choices: Option[]): Option | undefined {
			let textValue: Option | undefined = choices.find((item) => item.value === value);

			for (const choice of choices) {
				if (!textValue) {
					if (choice.children) {
						textValue = findValue(choice.children);
					}
				}
			}

			return textValue;
		}
	}
}
</script>

<template>
	<v-menu
		class="v-select"
		:disabled="disabled"
		:attached="inline === false"
		:show-arrow="inline === true"
		:close-on-content-click="closeOnContentClick"
		:placement="placement"
		:full-height="menuFullHeight"
	>
		<template #activator="{ toggle, active }">
			<button
				v-if="inline"
				type="button"
				:disabled="disabled"
				:aria-pressed="active"
				class="inline-display"
				:class="{ placeholder: !displayValue.text, label, active, disabled }"
				@click="toggle"
			>
				<slot name="preview">{{ displayValue.text || placeholder }}</slot>
				<v-icon name="expand_more" :class="{ active }" />
			</button>
			<slot
				v-else
				name="preview"
				v-bind="{
					toggle: toggle,
					active: active,
				}"
			>
				<v-input
					:full-width="fullWidth"
					readonly
					:model-value="displayValue.text"
					clickable
					:placeholder="placeholder"
					:disabled="disabled"
					:active="active"
					@click="toggle"
					@keydown:enter="toggle"
					@keydown:space="toggle"
				>
					<template v-if="$slots.prepend || displayValue.icon || displayValue.color" #prepend>
						<slot v-if="$slots.prepend" name="prepend" />
						<v-icon v-else-if="displayValue.icon" :name="displayValue.icon" :color="displayValue.color" />
						<display-color v-else-if="displayValue.color" :value="displayValue.color" />
					</template>
					<template #append>
						<v-icon name="expand_more" :class="{ active }" />
						<slot name="append" />
					</template>
				</v-input>
			</slot>
		</template>

		<v-list class="list" :mandatory="mandatory" @toggle="$emit('group-toggle', $event)">
			<template v-if="showDeselect">
				<v-list-item
					clickable
					:disabled="modelValue === null || (Array.isArray(modelValue) && !modelValue.length)"
					@click="$emit('update:modelValue', null)"
				>
					<v-list-item-icon v-if="multiple === true">
						<v-icon name="close" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ multiple ? $t('deselect_all') : $t('deselect') }}
					</v-list-item-content>
					<v-list-item-icon v-if="multiple === false">
						<v-icon name="close" />
					</v-list-item-icon>
				</v-list-item>
				<v-divider />
			</template>

			<v-list-item v-if="internalItemsCount === 0 && !allowOther">
				<v-list-item-content>
					{{ $t('no_options_available') }}
				</v-list-item-content>
			</v-list-item>

			<v-list-item v-if="internalItemsCount > 10 || search">
				<v-list-item-content>
					<v-input v-model="search" autofocus small :placeholder="$t('search')" @click.stop.prevent>
						<template #append>
							<v-icon small name="search" />
						</template>
					</v-input>
				</v-list-item-content>
			</v-list-item>

			<template v-for="(item, index) in internalItems" :key="index">
				<select-list-item-group
					v-if="item.children"
					:item="item"
					:item-label-font-family="itemLabelFontFamily"
					:model-value="modelValue"
					:multiple="multiple"
					:allow-other="allowOther"
					:group-selectable="groupSelectable"
					@update:model-value="$emit('update:modelValue', $event)"
				/>
				<select-list-item
					v-else
					:model-value="modelValue"
					:item="item"
					:item-label-font-family="itemLabelFontFamily"
					:multiple="multiple"
					:allow-other="allowOther"
					@update:model-value="$emit('update:modelValue', $event)"
				/>
			</template>

			<v-list-item v-if="allowOther && multiple === false" :active="usesOtherValue" @click.stop>
				<v-list-item-content>
					<input
						v-model="otherValue"
						class="other-input"
						:placeholder="$t('other')"
						@focus="otherValue ? $emit('update:modelValue', otherValue) : null"
					/>
				</v-list-item-content>
			</v-list-item>

			<template v-if="allowOther && multiple === true">
				<v-list-item
					v-for="otherVal in otherValues"
					:key="otherVal.key"
					:active="
						(modelValue && (typeof modelValue === 'string' || isArray(modelValue)) ? modelValue : []).includes(
							otherVal.value,
						)
					"
				>
					<v-list-item-content>
						<v-checkbox
							:model-value="modelValue || []"
							:value="otherVal.value"
							custom-value
							:autofocus-custom-input="otherVal.focus"
							@update:model-value="$emit('update:modelValue', $event)"
							@update:value="setOtherValue(otherVal.key, $event)"
							@blur:custom-input="onBlurCustomInput(otherVal)"
						/>
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon v-tooltip="$t('remove_item')" name="delete" clickable @click="setOtherValue(otherVal.key, null)" />
					</v-list-item-icon>
				</v-list-item>

				<v-list-item clickable @click.stop="addOtherValue('', true)">
					<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
					<v-list-item-content>{{ $t('other') }}</v-list-item-content>
				</v-list-item>
			</template>
		</v-list>
	</v-menu>
</template>

<style scoped lang="scss">
/*

	Available Variables:

		--v-select-font-family        [var(--theme--fonts--sans--font-family)]
		--v-select-placeholder-color  [var(--theme--foreground-subdued)]

*/

.list {
	--v-list-min-width: 180px;
}

.v-input {
	--v-input-font-family: var(--v-select-font-family, var(--theme--fonts--sans--font-family));

	cursor: pointer;
}

.v-input .v-icon {
	transition: transform var(--medium) var(--transition-out);
}

.v-input .v-icon.active {
	transform: scaleY(-1);
	transition-timing-function: var(--transition-in);
}

.v-input :deep(input) {
	cursor: pointer;
}

.other-input {
	margin: 0;
	padding: 0;
	line-height: 1.2;
	background-color: transparent;
	border: none;
	border-radius: 0;
}

.inline-display {
	inline-size: max-content;
	padding-inline-end: 18px;

	&:not(.disabled) {
		cursor: pointer;
	}
}

.inline-display.label {
	padding: 4px 8px;
	padding-inline-end: 26px;
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--form--field--input--background-subdued);
	border-radius: var(--theme--border-radius);
	transition: color var(--fast) var(--transition);

	&:hover,
	&.active {
		color: var(--foreground);
	}
}

.inline-display .v-icon {
	position: absolute;
}

.inline-display.placeholder {
	color: var(--v-select-placeholder-color, var(--theme--foreground-subdued));
}

.color-dot {
	margin-inline: 7px;
}
</style>
