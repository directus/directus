<template>
	<value-null v-if="value === null || value === undefined" />
	<v-text-overflow v-else-if="displayInfo === null" class="display" :text="value" />
	<v-error-boundary v-else :name="`display-${display}`">
		<component
			:is="`display-${display}`"
			v-bind="options"
			:interface="interface"
			:interface-options="interfaceOptions"
			:value="value"
			:type="type"
			:collection="collection"
			:field="field"
		/>

		<template #fallback>
			<v-text-overflow class="display" :text="value" />
		</template>
	</v-error-boundary>
</template>

<script lang="ts">
import { useExtension } from '@/composables/use-extension';
import { defineComponent } from 'vue';

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
		const displayInfo = useExtension('display', props.display);

		return { displayInfo };
	},
});
</script>

<style lang="scss" scoped>
.display {
	line-height: 22px;
}
</style>
