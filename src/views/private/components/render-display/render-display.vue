<template>
	<span v-if="value === null || value === undefined">--</span>
	<span v-else-if="!displayInfo">{{ value }}</span>
	<span v-else-if="typeof displayInfo.handler === 'function'">
		{{ display.handler(value, options) }}
	</span>
	<component
		v-else
		:is="`display-${display}`"
		v-bind="options"
		:interface="$props.interface"
		:interface-options="interfaceOptions"
		:value="value"
	/>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import displays from '@/displays';

export default defineComponent({
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
	},
	setup(props) {
		const displayInfo = displays.find((display) => display.id === props.display) || null;
		return { displayInfo };
	},
});
</script>
