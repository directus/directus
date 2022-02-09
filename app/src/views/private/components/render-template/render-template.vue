<template>
	<div ref="templateEl" class="render-template">
		<span class="vertical-aligner" />
		<template v-for="(part, index) in parts" :key="index">
			<value-null v-if="part === null || (typeof part === 'object' && part.value === null)" />
			<component
				:is="`display-${part.component}`"
				v-else-if="typeof part === 'object' && part.component"
				v-bind="part.options"
				:value="part.value"
				:interface="part.interface"
				:interface-options="part.interfaceOptions"
				:type="part.type"
				:collection="part.collection"
				:field="part.field"
			/>
			<span v-else-if="typeof part === 'string'">{{ translate(part) }}</span>
			<span v-else>{{ part }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { useFieldsStore } from '@/stores';
import { get } from 'lodash';
import { Field } from '@directus/shared/types';
import { getDisplay } from '@/displays';
import ValueNull from '@/views/private/components/value-null';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';
import { translate } from '@/utils/translate-literal';

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
			default: null,
		},
		template: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const fieldsStore = useFieldsStore();

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

					if (!field) return value;

					const display = field?.meta?.display || getDefaultDisplayForType(field.type);

					// No need to render the empty display overhead in this case
					if (display === 'raw') return value;

					const displayInfo = getDisplay(field.meta?.display);

					// If used display doesn't exist in the current project, return raw value
					if (!displayInfo) return value;

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
				.map((p) => p ?? null)
		);

		return { parts, templateEl, translate };
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

	.render-template {
		display: inline;
	}
}

.subdued {
	color: var(--foreground-subdued);
}
</style>
