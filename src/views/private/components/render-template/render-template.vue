<template>
	<div class="render-template">
		<template v-for="(part, index) in parts">
			<component
				v-if="part !== null && typeof part === 'object'"
				:is="`display-${part.component}`"
				:key="index"
				:value="part.value"
				:interface="part.interface"
				:interface-options="part.interfaceOptions"
				v-bind="part.options"
			/>
			<template v-else>{{ part }}</template>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import useFieldsStore from '@/stores/fields';
import { get } from 'lodash';
import { Field } from '@/stores/fields/types';
import displays from '@/displays';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		item: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
		template: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const fieldsStore = useFieldsStore();

		const regex = /({{.*?}})/g;

		const parts = computed(() =>
			props.template.split(regex).map((part) => {
				if (part.startsWith('{{') === false) return part;

				const fieldKey = part.replace(/{{/g, '').replace(/}}/g, '').trim();
				const field: Field | null = fieldsStore.getField(props.collection, fieldKey);

				// Instead of crashing when the field doesn't exist, we'll render a couple question
				// marks to indicate it's absence
				if (!field) return '???';

				// Try getting the value from the item, return some question marks if it doesn't exist
				const value = get(props.item, fieldKey);
				if (value === undefined) return '???';

				// If no display is configured, we can render the raw value
				if (field.display === null) return value;

				const displayInfo = displays.find((display) => display.id === field.display);

				// If used display doesn't exist in the current project, return raw value
				if (!displayInfo) return value;

				// If the display handler is a function, we parse the value and return the result
				if (typeof displayInfo.handler === 'function') {
					const handler = displayInfo.handler as Function;
					return handler(value, field.display_options);
				}

				return {
					component: field.display,
					options: field.display_options,
					value: value,
					interface: field.interface,
					interfaceOptions: field.options,
				};
			})
		);

		return { parts };
	},
});
</script>

<style lang="scss" scoped>
.render-template {
	display: contents;
}
</style>
