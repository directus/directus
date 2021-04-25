<template>
	<div class="render-template" ref="templateEl">
		<span class="vertical-aligner" />
		<template v-for="(part, index) in parts">
			<value-null :key="index" v-if="part === null || part.value === null" />
			<component
				v-else-if="typeof part === 'object' && part.component"
				:is="`display-${part.component}`"
				:key="index"
				:value="part.value"
				:interface="part.interface"
				:interface-options="part.interfaceOptions"
				:type="part.type"
				:collection="part.collection"
				:field="part.field"
				v-bind="part.options"
			/>
			<span :key="index" v-else>{{ part }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { useFieldsStore } from '@/stores';
import { get } from 'lodash';
import { Field } from '@/types';
import { getDisplays } from '@/displays';
import ValueNull from '@/views/private/components/value-null';

export default defineComponent({
	components: { ValueNull },
	props: {
		collection: {
			type: String,
			default: null,
		},
		fields: {
			type: Array as PropType<Field[]>,
			default: null,
		},
		item: {
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
		const { displays } = getDisplays();

		const templateEl = ref<HTMLElement>();

		const regex = /({{.*?}})/g;

		const parts = computed(() =>
			props.template
				.split(regex)
				.filter((p) => p)
				.map((part) => {
					if (part.startsWith('{{') === false) return part;

					let fieldKey = part.replace(/{{/g, '').replace(/}}/g, '').trim();
					const field: Field | undefined =
						fieldsStore.getField(props.collection, fieldKey) || props.fields?.find((field) => field.field === fieldKey);

					/**
					 * This is for cases where you are rendering a display template directly on
					 * directus_files. The $thumbnail fields doesn't exist, but instead renders a
					 * thumbnail based on the other fields in the file info. In that case, the value
					 * should be the whole related file object, not just the fake "thumbnail" field. By
					 * stripping out the thumbnail part in the field key path, the rest of the function
					 * will extract the value correctly.
					 */
					if (field && field.collection === 'directus_files' && field.field === '$thumbnail') {
						fieldKey = fieldKey
							.split('.')
							.filter((part) => part !== '$thumbnail')
							.join('.');
					}

					// Try getting the value from the item, return some question marks if it doesn't exist
					const value = get(props.item, fieldKey);
					if (value === undefined) return null;

					// If no display is configured, we can render the raw value
					if (!field || !field.meta?.display) return value;

					const displayInfo = displays.value.find((display) => display.id === field.meta?.display);

					// If used display doesn't exist in the current project, return raw value
					if (!displayInfo) return value;

					// If the display handler is a function, we parse the value and return the result
					if (typeof displayInfo.handler === 'function') {
						const handler = displayInfo.handler as Function;
						return handler(value, field.meta?.display_options);
					}

					return {
						component: field.meta?.display,
						options: field.meta?.display_options,
						value: value,
						interface: field.meta?.interface,
						interfaceOptions: field.meta?.options,
						type: field.type,
						collection: field.collection,
						field: field.field,
					};
				})
				.map((p) => p || null)
		);

		return { parts, templateEl };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.render-template {
	position: relative;
	max-width: 100%;
	height: 100%;
	padding-right: 8px;

	.vertical-aligner {
		display: inline-block;
		width: 0;
		height: 100%;
		vertical-align: middle;
	}

	@include no-wrap;

	> * {
		vertical-align: middle;
	}
}

.subdued {
	color: var(--foreground-subdued);
}
</style>
