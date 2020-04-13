<template>
	<v-menu class="v-select" attached :close-on-content-click="multiple === false">
		<template #activator="{ toggle }">
			<v-input
				:full-width="fullWidth"
				:monospace="monospace"
				readonly
				:value="displayValue"
				@click="toggle"
				:placeholder="placeholder"
			>
				<template #append><v-icon name="expand_more" /></template>
			</v-input>
		</template>

		<v-list>
			<v-list-item
				v-for="item in _items"
				:key="item.value"
				:class="{
					active: multiple ? (value || []).includes(item.value) : value === item.value,
				}"
				@click="multiple ? null : $emit('input', item.value)"
			>
				<v-list-item-content>
					<v-list-item-title v-if="multiple === false">
						<span :class="{ monospace }">{{ item.text }}</span>
					</v-list-item-title>
					<v-checkbox
						v-else
						:inputValue="value || []"
						:label="item.text"
						:value="item.value"
						@change="$emit('input', $event.length > 0 ? $event : null)"
					/>
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';

type Item = {
	text: string;
	value: string | number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsRaw = (string | any)[];
type InputValue = (string | number)[] | string | number;

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
			default: false,
		},
		monospace: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const _items = computed(() =>
			props.items.map((item) => {
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
			})
		);

		const displayValue = computed(() => {
			if (Array.isArray(props.value)) {
				return props.value
					.map((value) => {
						return getTextForValue(value);
					})
					.join(', ');
			}

			return getTextForValue(props.value);
		});

		return { _items, displayValue };

		function getTextForValue(value: string | number) {
			return _items.value.find((item) => item.value === value)?.['text'];
		}
	},
});
</script>

<style lang="scss" scoped>
.monospace {
	font-family: var(--family-monospace);
}

.v-input {
	cursor: pointer;

	::v-deep input {
		cursor: pointer;
	}
}
</style>
