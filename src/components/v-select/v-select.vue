<template>
	<v-menu :disabled="disabled" class="v-select" attached>
		<template #activator="{ toggle }">
			<v-input
				:full-width="fullWidth"
				readonly
				:value="displayValue"
				@click="toggle"
				:placeholder="placeholder"
				:disabled="disabled"
			>
				<template #prepend><slot name="prepend" /></template>
				<template #append><v-icon name="expand_more" /></template>
			</v-input>
		</template>

		<v-list dense>
			<template v-if="showDeselect">
				<v-list-item @click="$emit('input', null)" :disabled="value === null">
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

			<v-list-item
				v-for="item in _items"
				:key="item.value"
				:active="multiple ? (value || []).includes(item.value) : value === item.value"
				@click="multiple ? null : $emit('input', item.value)"
			>
				<v-list-item-content>
					<span v-if="multiple === false" class="item-text">{{ item.text }}</span>
					<v-checkbox
						v-else
						:inputValue="value || []"
						:label="item.text"
						:value="item.value"
						@change="$emit('input', $event.length > 0 ? $event : null)"
					/>
				</v-list-item-content>
			</v-list-item>

			<v-list-item v-if="allowOther && multiple === false" :active="usesOtherValue">
				<v-list-item-content>
					<input
						class="other-input"
						@focus="otherValue ? $emit('input', otherValue) : null"
						v-model="otherValue"
						:placeholder="$t('other')"
					/>
				</v-list-item-content>
			</v-list-item>

			<template v-if="allowOther && multiple === true">
				<v-list-item
					v-for="otherValue in otherValues"
					:key="otherValue.key"
					:active="(value || []).includes(otherValue.value)"
				>
					<v-list-item-icon>
						<v-checkbox
							:inputValue="value || []"
							:value="otherValue.value"
							@change="$emit('input', $event.length > 0 ? $event : null)"
						/>
					</v-list-item-icon>
					<v-list-item-content>
						<input
							class="other-input"
							:value="otherValue.value"
							:placeholder="$t('other')"
							v-focus
							@input="setOtherValue(otherValue.key, $event.target.value)"
							@blur="
								otherValue.value.length === 0 && setOtherValue(otherValue.key, null)
							"
						/>
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="close" @click="setOtherValue(otherValue.key, null)" />
					</v-list-item-icon>
				</v-list-item>

				<v-list-item @click="addOtherValue()">
					<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
					<v-list-item-content>{{ $t('other') }}</v-list-item-content>
				</v-list-item>
			</template>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from '@vue/composition-api';
import { nanoid } from 'nanoid';
import i18n from '@/lang';

type Item = {
	text: string;
	value: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsRaw = (string | any)[];
type InputValue = string[] | string;

export default defineComponent({
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
		value: {
			type: [Array, String, Number] as PropType<InputValue>,
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
	},
	setup(props, { emit }) {
		const { _items } = useItems();
		const { displayValue } = useDisplayValue();
		const { otherValue, usesOtherValue } = useCustomValue();
		const { otherValues, addOtherValue, setOtherValue } = useMultipleCustomValues();

		return {
			_items,
			displayValue,
			otherValue,
			usesOtherValue,
			otherValues,
			addOtherValue,
			setOtherValue,
		};

		function useItems() {
			const _items = computed(() => {
				const items = props.items.map((item) => {
					if (typeof item === 'string') {
						return {
							text: item,
							value: item,
						};
					}

					return {
						text: item[props.itemText],
						value: item[props.itemValue],
					};
				});

				return items;
			});

			return { _items };
		}

		function useDisplayValue() {
			const displayValue = computed(() => {
				if (Array.isArray(props.value)) {
					if (props.value.length < 3) {
						return props.value
							.map((value) => {
								return getTextForValue(value) || value;
							})
							.join(', ');
					} else {
						const itemCount = _items.value.length + otherValues.value.length;
						const selectionCount = props.value.length;

						if (itemCount === selectionCount) {
							return i18n.t('all_items');
						} else {
							return i18n.tc('item_count', selectionCount);
						}
					}
				}

				return getTextForValue(props.value) || props.value;
			});

			return { displayValue };

			function getTextForValue(value: string | number) {
				return _items.value.find((item) => item.value === value)?.['text'];
			}
		}

		function useCustomValue() {
			const localOtherValue = ref('');

			const otherValue = computed({
				get() {
					return localOtherValue.value;
				},
				set(newValue: string | null) {
					if (newValue === null) {
						localOtherValue.value = '';
						emit('input', null);
					} else {
						localOtherValue.value = newValue;
						emit('input', newValue);
					}
				},
			});

			const usesOtherValue = computed(() => {
				// Check if set value is one of the existing keys
				const values = _items.value.map((item) => item.value);
				return (
					props.value !== null &&
					props.value.length > 0 &&
					values.includes(props.value) === false
				);
			});

			return { otherValue, usesOtherValue };
		}

		function useMultipleCustomValues() {
			type OtherValue = {
				key: string;
				value: string;
			};

			const otherValues = ref<OtherValue[]>([]);

			watch(
				() => props.value,
				(newValue) => {
					if (newValue === null) return;
					if (Array.isArray(newValue) === false) return;

					(newValue as string[]).forEach((value) => {
						const values = _items.value.map((item) => item.value);
						const existsInValues = values.includes(value) === true;

						if (existsInValues === false) {
							const other = otherValues.value.map((o) => o.value);
							const existsInOtherValues = other.includes(value) === true;

							if (existsInOtherValues === false) {
								addOtherValue(value);
							}
						}
					});
				}
			);

			return { otherValues, addOtherValue, setOtherValue };

			function addOtherValue(value = '') {
				otherValues.value = [
					...otherValues.value,
					{
						key: nanoid(),
						value: value,
					},
				];
			}

			function setOtherValue(key: string, newValue: string | null) {
				const previousValue = otherValues.value.find((o) => o.key === key);

				const valueWithoutPrevious = ((props.value || []) as string[]).filter(
					(val) => val !== previousValue?.value
				);

				if (newValue === null) {
					otherValues.value = otherValues.value.filter((o) => o.key !== key);

					if (valueWithoutPrevious.length === 0) {
						emit('input', null);
					} else {
						emit('input', valueWithoutPrevious);
					}
				} else {
					otherValues.value = otherValues.value.map((otherValue) => {
						if (otherValue.key === key) otherValue.value = newValue;
						return otherValue;
					});

					const newEmitValue = [...valueWithoutPrevious, newValue];

					emit('input', newEmitValue);
				}
			}
		}
	},
});
</script>

<style>
:root {
	--v-select-font-family: var(--family-sans-serif);
}
</style>

<style lang="scss" scoped>
.item-text {
	font-family: var(--v-select-font-family);
}

.v-input {
	--v-input-font-family: var(--v-select-font-family);

	cursor: pointer;

	::v-deep input {
		cursor: pointer;
	}
}

.other-input {
	margin: 0;
	padding: 0;
	line-height: 1.2;
	background-color: transparent;
	border: none;
	border-radius: 0;
}
</style>
