<template>
	<value-null v-if="value === null || value === undefined" />
	<v-text-overflow v-else-if="displayInfo === null" class="display" :text="value" />
	<component
		:is="`display-${display}`"
		v-else
		v-bind="translate(options ?? {})"
		:interface="interface"
		:interface-options="interfaceOptions"
		:value="value"
		:type="type"
		:collection="collection"
		:field="field"
	/>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { getDisplay } from '@/displays';
import ValueNull from '@/views/private/components/value-null';
import { translate } from '@/utils/translate-object-values';

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
		const displayInfo = computed(() => getDisplay(props.display));
		return { displayInfo, translate };
	},
});
</script>

<style lang="scss" scoped>
.display {
	line-height: 22px;
}
</style>
