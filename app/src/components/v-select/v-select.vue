<template>
	<v-menu
		class="v-select"
		:disabled="disabled"
		:attached="inline === false"
		:is-same-width="isMenuSameWidth"
		:show-arrow="inline === true"
		:close-on-content-click="closeOnContentClick"
		:placement="placement"
	>
		<template #activator="{ toggle, active }">
			<div
				v-if="inline"
				class="inline-display"
				:class="{ placeholder: !displayValue, label, active, disabled }"
				@click="toggle"
			>
				<slot name="preview">{{ displayValue || placeholder }}</slot>
				<v-icon name="expand_more" :class="{ active }" />
			</div>
			<slot v-else name="preview">
				<v-input
					:full-width="fullWidth"
					readonly
					:model-value="displayValue"
					clickable
					:placeholder="placeholder"
					:disabled="disabled"
					:active="active"
					@click="toggle"
				>
					<template v-if="$slots.prepend" #prepend><slot name="prepend" /></template>
					<template #append>
						<v-icon name="expand_more" :class="{ active }" />
						<slot name="append" />
					</template>
				</v-input>
			</slot>
		</template>

		<v-list class="list" :mandatory="mandatory" @toggle="$emit('group-toggle', $event)">
			<template v-if="showDeselect">
				<v-list-item clickable :disabled="modelValue === null" @click="$emit('update:modelValue', null)">
					<v-list-item-icon v-if="multiple === true">
						<v-icon name="close" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ multiple ? t('deselect_all') : t('deselect') }}
					</v-list-item-content>
					<v-list-item-icon v-if="multiple === false">
						<v-icon name="close" />
					</v-list-item-icon>
				</v-list-item>
				<v-divider />
			</template>

			<v-list-item v-if="internalItemsCount > 20 || search">
				<v-list-item-content>
					<v-input v-model="search" autofocus small :placeholder="t('search')" @click.stop.prevent>
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
						:placeholder="t('other')"
						@focus="otherValue ? $emit('update:modelValue', otherValue) : null"
					/>
				</v-list-item-content>
			</v-list-item>

			<template v-if="allowOther && multiple === true">
				<v-list-item
					v-for="otherVal in otherValues"
					:key="otherVal.key"
					:active="(modelValue || []).includes(otherVal.value)"
					@click.stop
				>
					<v-list-item-icon>
						<v-checkbox
							:model-value="modelValue || []"
							:value="otherVal.value"
							@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
						/>
					</v-list-item-icon>
					<v-list-item-content>
						<input
							v-focus
							class="other-input"
							:value="otherVal.value"
							:placeholder="t('other')"
							@input="setOtherValue(otherVal.key, ($event.target as any)?.value)"
							@blur="otherVal.value.length === 0 && setOtherValue(otherVal.key, null)"
						/>
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="close" clickable @click="setOtherValue(otherVal.key, null)" />
					</v-list-item-icon>
				</v-list-item>

				<v-list-item @click.stop="addOtherValue()">
					<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
					<v-list-item-content>{{ t('other') }}</v-list-item-content>
				</v-list-item>
			</template>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { useCustomSelection, useCustomSelectionMultiple } from '@directus/composables';
import { Placement } from '@popperjs/core';
import { debounce, get } from 'lodash';
import { computed, Ref, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SelectListItemGroup from './select-list-item-group.vue';
import SelectListItem from './select-list-item.vue';
import { Option } from './types';

type ItemsRaw = (string | any)[];
type InputValue = string[] | string | number | null;

interface Props {
	/** The items that should be selectable */
	items: ItemsRaw;
	/** Which key in items is used to display the text */
	itemText?: string;
	/** Which key in items is used to model the active state */
	itemValue?: string;
	/** Which key in items is used to show an icon */
	itemIcon?: string | null;
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
	/** Limits the amount of items inside the preview */
	multiplePreviewThreshold?: number;
	/** The direction the menu should open */
	placement?: Placement;
	/** Should the menu be the same width as the select element */
	isMenuSameWidth?: true;
}

const props = withDefaults(defineProps<Props>(), {
	itemText: 'text',
	itemValue: 'value',
	itemIcon: null,
	itemDisabled: 'disabled',
	itemSelectable: 'selectable',
	itemChildren: 'children',
	modelValue: null,
	multiple: false,
	groupSelectable: false,
	mandatory: true,
	placeholder: null,
	fullWidth: true,
	disabled: false,
	showDeselect: false,
	allowOther: false,
	closeOnContentClick: true,
	inline: false,
	label: false,
	multiplePreviewThreshold: 3,
	placement: 'bottom',
	isMenuSameWidth: true,
});

const emit = defineEmits(['update:modelValue', 'group-toggle']);

const { t } = useI18n();

const { internalItems, internalItemsCount, internalSearch } = useItems();
const { displayValue } = useDisplayValue();
const { modelValue } = toRefs(props);

const { otherValue, usesOtherValue } = useCustomSelection(modelValue as Ref<string>, internalItems, (value) =>
	emit('update:modelValue', value)
);

const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(
	modelValue as Ref<string[]>,
	internalItems,
	(value) => emit('update:modelValue', value)
);

const search = ref<string | null>(null);

watch(
	search,
	debounce((val: string | null) => {
		internalSearch.value = val;
	}, 250)
);

function useItems() {
	const internalSearch = ref<string | null>(null);

	const internalItems = computed(() => {
		const parseItem = (item: Record<string, any>): Option => {
			if (typeof item === 'string') {
				return {
					text: item,
					value: item,
				};
			}

			if (item.divider === true) return { value: null, divider: true };

			const children = get(item, props.itemChildren) ? get(item, props.itemChildren).map(parseItem) : null;

			return {
				text: get(item, props.itemText),
				value: get(item, props.itemValue),
				icon: props.itemIcon ? get(item, props.itemIcon) : undefined,
				disabled: get(item, props.itemDisabled),
				selectable: get(item, props.itemSelectable),
				children: children ? children.filter(filterItem) : children,
				hidden: internalSearch.value ? !filterItem(item) : false,
			};
		};

		const filterItem = (item: Record<string, any>): boolean => {
			if (!internalSearch.value) return true;

			const searchValue = internalSearch.value.toLowerCase();

			return item?.children
				? isMatchingCurrentItem(item, searchValue) ||
						item.children.some((item: Record<string, any>) => filterItem(item))
				: isMatchingCurrentItem(item, searchValue);

			function isMatchingCurrentItem(item: Record<string, any>, searchValue: string): boolean {
				const text = get(item, props.itemText);
				const value = get(item, props.itemValue);
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
				return props.modelValue
					.map((value) => {
						return getTextForValue(value) || value;
					})
					.join(', ');
			} else {
				const itemCount = internalItems.value.length + otherValues.value.length;
				const selectionCount = props.modelValue.length;

				if (itemCount === selectionCount) {
					return t('all_items');
				} else {
					return t('item_count', selectionCount);
				}
			}
		}

		return getTextForValue(props.modelValue) || props.modelValue;
	});

	return { displayValue };

	function getTextForValue(value: string | number | null) {
		return findValue(internalItems.value);

		function findValue(choices: Option[]): string | undefined {
			let textValue: string | undefined = choices.find((item) => item.value === value)?.['text'];

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

<style scoped lang="scss">
:global(body) {
	--v-select-font-family: var(--family-sans-serif);
	--v-select-placeholder-color: var(--foreground-subdued);
}

.list {
	--v-list-min-width: 0;
}

.item-text {
	font-family: var(--v-select-font-family);
}

.v-input {
	--v-input-font-family: var(--v-select-font-family);

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
	width: max-content;
	padding-right: 18px;

	&:not(.disabled) {
		cursor: pointer;
	}
}

.inline-display.label {
	padding: 4px 8px;
	padding-right: 26px;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);
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
	color: var(--v-select-placeholder-color);
}
</style>
