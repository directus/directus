<template>
	<value-null v-if="value === null || value === undefined" />
	<span v-else-if="displayInfo === null">{{ value }}</span>
	<span v-else-if="typeof displayInfo.handler === 'function'">
		{{ display.handler(value, options, { type }) }}
	</span>
	<component
		v-else
		:is="`display-${display}`"
		v-bind="options"
		:interface="$props.interface"
		:interface-options="interfaceOptions"
		:value="value"
		:type="type"
	/>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import displays from '@/displays';
import ValueNull from '@/views/private/components/value-null';

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
			type: [String, Number, Object, Array],
			default: null,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const displayInfo = computed(
			() => displays.find((display) => display.id === props.display) || null
		);
		return { displayInfo };
	},
});
</script>
