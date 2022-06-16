<template>
	<v-menu
		class="v-select"
		:disabled="disabled"
		:attached="inline === false"
		:show-arrow="inline === true"
		:close-on-content-click="closeOnContentClick"
		:placement="placement"
	>
		<template #activator="{ toggle, active }">
			<div v-if="inline" class="inline-display" :class="{ placeholder: !displayValue, label, active }" @click="toggle">
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
							@input="setOtherValue(otherVal.key, $event.target.value)"
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

<script lang="ts">
import { useCustomSelection, useCustomSelectionMultiple } from '@/composables/use-custom-selection';
import { Placement } from '@popperjs/core';
import { debounce, get } from 'lodash';
import { computed, defineComponent, PropType, Ref, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SelectListItemGroup from './select-list-item-group.vue';
import SelectListItem from './select-list-item.vue';
import { Option } from './types';

type ItemsRaw = (string | any)[];
type InputValue = string[] | string;

export default defineComponent({
	components: { SelectListItemGroup, SelectListItem },
	props: {
		items: {
			type: Array as PropType<ItemsRaw>,
			required: true,
		},
		itemText: {
			type: String,
			default: 'text',
		},
		itemValue: {
			type: String,
			default: 'value',
		},
		itemIcon: {
			type: String,
			default: null,
		},
		itemDisabled: {
			type: String,
			default: 'disabled',
		},
		itemSelectable: {
			type: String,
			default: 'selectable',
		},
		itemChildren: {
			type: String,
			default: 'children',
		},
		modelValue: {
			type: [Array, String, Number, Boolean] as PropType<InputValue>,
			default: null,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		mandatory: {
			type: Boolean,
			default: true,
		},
		placeholder: {
			type: String,
			default: null,
		},
		fullWidth: {
			type: Boolean,
			default: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		showDeselect: {
			type: Boolean,
			default: false,
		},
		allowOther: {
			type: Boolean,
			default: false,
		},
		closeOnContentClick: {
			type: Boolean,
			default: true,
		},
		inline: {
			type: Boolean,
			default: false,
		},
		label: {
			type: Boolean,
			default: false,
		},
		multiplePreviewThreshold: {
			type: Number,
			default: 3,
		},
		placement: {
			type: String as PropType<Placement>,
			default: 'bottom',
		},
	},
	emits: ['update:modelValue', 'group-toggle'],
	setup(props, { emit }) {
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

		return {
			t,
			internalItems,
			internalItemsCount,
			displayValue,
			otherValue,
			usesOtherValue,
			otherValues,
			addOtherValue,
			setOtherValue,
			search,
		};

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
						icon: get(item, props.itemIcon),
						disabled: get(item, props.itemDisabled),
						selectable: get(item, props.itemSelectable),
						children: children ? children.filter(filterItem) : children,
					};
				};

				const filterItem = (item: Record<string, any>): boolean => {
					if (!internalSearch.value) return true;

					const searchValue = internalSearch.value.toLowerCase();

					return item?.children
						? item.children.some((item: Record<string, any>) => filterItem(item))
						: item.text?.toLowerCase().includes(searchValue) || item.value?.toLowerCase().includes(searchValue);
				};

				const items = internalSearch.value ? props.items.filter(filterItem).map(parseItem) : props.items.map(parseItem);

				return items;
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

			function getTextForValue(value: string | number) {
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
	},
});
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
	cursor: pointer;
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
