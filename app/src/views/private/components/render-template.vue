<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { useFieldsStore } from '@/stores/fields';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';
import { translate } from '@/utils/translate-literal';
import { Field } from '@directus/types';
import { get, flatMap } from 'lodash';
import { computed, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		template: string;
		collection?: string;
		fields?: Field[];
		item?: Record<string, any>;
		direction?: string;
	}>(),
	{
		fields: () => [],
		item: () => ({}),
	},
);

const fieldsStore = useFieldsStore();

const templateEl = ref<HTMLElement>();

const regex = /({{.*?}})/g;

const getNestedValues = (data: any, path: string) => {
	const pathParts = path.split('.');
	let currentData = data;

	for (const part of pathParts) {
		if (Array.isArray(currentData)) {
			currentData = flatMap(currentData.map((item) => get(item, part)));
		} else {
			currentData = get(currentData, part);
		}
	}

	return Array.isArray(currentData) ? currentData : [currentData];
};

const parts = computed(() =>
	props.template
		.split(regex)
		.filter((p) => p)
		.map((part) => {
			if (part.startsWith('{{') === false) return [part];

			console.log('part', part);

			const fieldKey = part.replace(/{{/g, '').replace(/}}/g, '').trim();

			// Try getting the value from the item
			const value = getNestedValues(props.item, fieldKey);

			let field: Field | null = props.fields?.find((field) => field.field === fieldKey) ?? null;

			if (props.collection) {
				field = fieldsStore.getField(props.collection, fieldKey);
			}

			if (!field) return [value];

			const component = field?.meta?.display || getDefaultDisplayForType(field.type);
			const options = field?.meta?.display_options;

			// No need to render the empty display overhead in this case
			if (component === 'raw') return [value];

			const displayInfo = useExtension(
				'display',
				computed(() => component ?? null),
			);

			if (!displayInfo.value) return [value];

			// These displays natively support rendering arrays of values
			if (field?.meta?.display && ['related-values', 'formatted-value', 'labels'].includes(field?.meta?.display)) {
				return [
					{
						component,
						options,
						value: value,
						interface: field.meta?.interface,
						interfaceOptions: field.meta?.options,
						type: field.type,
						collection: field.collection,
						field: field.field,
					},
				];
			} else if (field?.meta?.display) {
				return value.map((v) => {
					return {
						component: field.meta?.display,
						options: field.meta?.display_options,
						value: v,
						interface: field.meta?.interface,
						interfaceOptions: field.meta?.options,
						type: field.type,
						collection: field.collection,
						field: field.field,
					};
				});
			} else {
				return value;
			}
		})
		.map((p) => p ?? null),
);
</script>

<template>
	<div ref="templateEl" class="render-template">
		<span class="vertical-aligner" />
		<template v-for="(part, index) in parts" :key="index">
			<v-error-boundary>
				<template v-for="(subPart, subIndex) in part" :key="subIndex">
					<value-null v-if="subPart === null || (typeof subPart === 'object' && subPart.value === null)" />
					<component
						:is="`display-${subPart.component}`"
						v-else-if="subPart?.component"
						v-bind="subPart.options"
						:value="subPart.value"
						:interface="subPart.interface"
						:interface-options="subPart.interfaceOptions"
						:type="subPart.type"
						:collection="subPart.collection"
						:field="subPart.field"
						class="displayed-component"
					/>
					<span v-else-if="typeof subPart === 'string'" :dir="direction">{{ translate(subPart) }}</span>
					<span v-else>{{ subPart }}</span>
				</template>

				<template #fallback>
					<span>{{ part }}</span>
				</template>
			</v-error-boundary>
		</template>
	</div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.render-template {
	height: 100%;
	position: relative;
	max-width: 100%;
	padding-right: 8px;
	@include no-wrap;

	.vertical-aligner {
		display: inline-block;
		width: 0;
		height: 100%;
		vertical-align: middle;
	}

	> * {
		vertical-align: middle;
	}

	.render-template {
		display: inline;
	}

	.displayed-component {
		margin-right: 4px;
	}
}

.subdued {
	color: var(--theme--foreground-subdued);
}
</style>
