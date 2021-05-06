<template>
	<value-null v-if="value === null || value === undefined" />
	<v-text-overflow v-else-if="displayInfo === null" class="display" :text="value" />
	<v-text-overflow
		v-else-if="typeof displayInfo.handler === 'function'"
		class="display"
		:text="displayInfo.handler(value, options, { type })"
	/>
	<component
		v-else
		:is="`display-${display}`"
		v-bind="options"
		:interface="$props.interface"
		:interface-options="interfaceOptions"
		:value="value"
		:type="type"
		:collection="collection"
		:field="field"
	/>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { getDisplays } from '@/displays';
import ValueNull from '@/views/private/components/value-null';
import { DisplayConfig } from '@/displays/types';

export default defineComponent({
	components: { ValueNull },
	props: {
		display: {
			type: String,
			default: null,
		},
		options: {
			type: Object,
			default: () => ({}),
		},
		interface: {
			type: String,
			default: null,
		},
		interfaceOptions: {
			type: Object,
			default: null,
		},
		value: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
		type: {
			type: String,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { displays } = getDisplays();
		const displayInfo = computed(
			() => displays.value.find((display: DisplayConfig) => display.id === props.display) || null
		);
		return { displayInfo };
	},
});
</script>

<style lang="scss" scoped>
.display {
	line-height: 22px;
}
</style>
