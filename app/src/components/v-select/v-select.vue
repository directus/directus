<template>
	<v-menu
		:disabled="disabled"
		class="v-select"
		:attached="inline === false"
		:show-arrow="inline === true"
		:close-on-content-click="closeOnContentClick"
	>
		<template #activator="{ toggle, active }">
			<div v-if="inline" class="inline-display" :class="{ placeholder: !displayValue }" @click="toggle">
				{{ displayValue || placeholder }}
				<v-icon name="expand_more" :class="{ active }" />
			</div>
			<v-input
				v-else
				:full-width="fullWidth"
				readonly
				:model-value="displayValue"
				clickable
				@click="toggle"
				:placeholder="placeholder"
				:disabled="disabled"
				:active="active"
			>
				<template v-if="$slots.prepend" #prepend><slot name="prepend" /></template>
				<template #append><v-icon name="expand_more" :class="{ active }" /></template>
			</v-input>
		</template>

		<v-list class="list">
			<template v-if="showDeselect">
				<v-list-item clickable @click="$emit('update:modelValue', null)" :disabled="modelValue === null">
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

			<template v-for="(item, index) in internalItems" :key="index">
				<v-divider v-if="item.divider === true" />

				<v-list-item
					v-else
					:active="multiple ? (modelValue || []).includes(item.value) : modelValue === item.value"
					:disabled="item.disabled"
					clickable
					@click="multiple ? null : $emit('update:modelValue', item.value)"
				>
					<v-list-item-icon v-if="multiple === false && allowOther === false && itemIcon !== null && item.icon">
						<v-icon :name="item.icon" />
					</v-list-item-icon>
					<v-list-item-content>
						<span v-if="multiple === false" class="item-text">{{ item.text }}</span>
						<v-checkbox
							v-else
							:model-value="modelValue || []"
							:label="item.text"
							:value="item.value"
							:disabled="item.disabled"
							@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
						/>
					</v-list-item-content>
				</v-list-item>
			</template>

			<v-list-item v-if="allowOther && multiple === false" :active="usesOtherValue" @click.stop>
				<v-list-item-content>
					<input
						class="other-input"
						@focus="otherValue ? $emit('update:modelValue', otherValue) : null"
						v-model="otherValue"
						:placeholder="t('other')"
					/>
				</v-list-item-content>
			</v-list-item>

			<template v-if="allowOther && multiple === true">
				<v-list-item
					v-for="otherValue in otherValues"
					:key="otherValue.key"
					:active="(modelValue || []).includes(otherValue.value)"
					@click.stop
				>
					<v-list-item-icon>
						<v-checkbox
							:model-value="modelValue || []"
							:value="otherValue.value"
							@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
						/>
					</v-list-item-icon>
					<v-list-item-content>
						<input
							class="other-input"
							:value="otherValue.value"
							:placeholder="t('other')"
							v-focus
							@input="setOtherValue(otherValue.key, $event.target.value)"
							@blur="otherValue.value.length === 0 && setOtherValue(otherValue.key, null)"
						/>
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="close" clickable @click="setOtherValue(otherValue.key, null)" />
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
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed, toRefs, Ref } from 'vue';
import { useCustomSelection, useCustomSelectionMultiple } from '@/composables/use-custom-selection';
import { get } from 'lodash';

type ItemsRaw = (string | any)[];
type InputValue = string[] | string;

export default defineComponent({
	emits: ['update:modelValue'],
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
		modelValue: {
			type: [Array, String, Number, Boolean] as PropType<InputValue>,
			default: null,
		},
		multiple: {
			type: Boolean,
			default: false,
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
		multiplePreviewThreshold: {
			type: Number,
			default: 3,
		},
	},
	setup(props, { emit }) {
		const { t } = useI18n();

		const { internalItems } = useItems();
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

		return { t, internalItems, displayValue, otherValue, usesOtherValue, otherValues, addOtherValue, setOtherValue };

		function useItems() {
			const internalItems = computed(() => {
				const items = props.items.map((item) => {
					if (typeof item === 'string') {
						return {
							text: item,
							value: item,
						};
					}

					if (item.divider === true) return { divider: true };

					return {
						text: get(item, props.itemText),
						value: get(item, props.itemValue),
						icon: get(item, props.itemIcon),
						disabled: get(item, props.itemDisabled),
					};
				});

				return items;
			});

			return { internalItems };
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
				return internalItems.value.find((item) => item.value === value)?.['text'];
			}
		}
	},
});
</script>

<style scoped>
:global(body) {
	--v-select-font-family: var(--family-sans-serif);
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

.inline-display .v-icon {
	position: absolute;
}

.inline-display.placeholder {
	color: var(--foreground-subdued);
}
</style>
