<script setup lang="ts">
import { Field } from '@directus/types';
import { get } from '@directus/utils';
import { computed, ref } from 'vue';
import ValueNull from './value-null.vue';
import VErrorBoundary from '@/components/v-error-boundary.vue';
import { useExtension } from '@/composables/use-extension';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';
import { translate } from '@/utils/translate-literal';

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
const relationsStore = useRelationsStore();

const templateEl = ref<HTMLElement>();

const regex = /({{.*?}})/g;

const getNestedValues = (data: any, path: string) => {
	const pathParts = path.split('.');
	let currentData = data;

	pathParts.filter(partWithoutDollarPrefix).forEach((part) => {
		if (props.collection && partIsM2AItem(part)) {
			const [itemField = '', anyCollection = ''] = part.split(':');
			if (!anyCollection || anyCollection !== getM2AJunctionCollectionField(props.collection, itemField)) return;
		}

		currentData = get(currentData, part) ?? null;
	});

	return Array.isArray(currentData) ? currentData : [currentData];

	function partWithoutDollarPrefix(part: string) {
		// For example `$thumbnail`
		return !part.startsWith('$');
	}

	function partIsM2AItem(part: string) {
		// For example `item:posts`
		return part.includes(':');
	}

	function getM2AJunctionCollectionField(collection: string, itemField: string) {
		const relations = relationsStore.getRelationsForField(collection, itemField);

		const collectionField =
			relations.find((relation) => relation.meta?.one_collection_field)?.meta?.one_collection_field ?? '';

		return currentData[collectionField];
	}
};

const parts = computed(() =>
	props.template
		.split(regex)
		.filter((p) => p)
		.map((part) => {
			if (part.startsWith('{{') === false) return [part];

			const fieldKey = part.replace(/{{/g, '').replace(/}}/g, '').trim();

			// Try getting the value from the item
			let value = getNestedValues(props.item, fieldKey);

			let field: Field | null = props.fields?.find((field) => field.field === fieldKey) ?? null;

			if (props.collection) {
				field = fieldsStore.getField(props.collection, fieldKey);
			}

			if (!field) return value;

			if (field?.meta?.interface === 'system-input-translated-string') {
				value = value.map(translate);
			}

			const component = field?.meta?.display || getDefaultDisplayForType(field.type);
			const options = field?.meta?.display_options;

			// No need to render the empty display overhead in this case
			if (component === 'raw') return value;

			const displayInfo = useExtension(
				'display',
				computed(() => component ?? null),
			);

			if (!displayInfo.value) return value;

			if (
				component &&
				['related-values', 'formatted-value', 'formatted-json-value', 'translations'].includes(component)
			) {
				// These displays natively support rendering arrays of values
				return [
					{
						component,
						options,
						value,
						interface: field.meta?.interface,
						interfaceOptions: field.meta?.options,
						type: field.type,
						collection: field.collection,
						field: field.field,
					},
				];
			} else if (component) {
				return value.map((v) => {
					return {
						component: component,
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
			<template v-for="(subPart, subIndex) in part" :key="subIndex">
				<VErrorBoundary>
					<ValueNull v-if="subPart === null || (typeof subPart === 'object' && subPart.value === null)" />
					<template v-else-if="subPart?.component">
						<component
							:is="`display-${subPart.component}`"
							v-bind="subPart.options"
							:value="subPart.value"
							:interface="subPart.interface"
							:interface-options="subPart.interfaceOptions"
							:type="subPart.type"
							:collection="subPart.collection"
							:field="subPart.field"
						/>
						<span v-if="subIndex < part.length - 1">&nbsp;</span>
					</template>
					<span v-else-if="typeof subPart === 'string'" :dir="direction">{{ translate(subPart) }}</span>
					<span v-else>{{ subPart }}</span>
					<template #fallback>
						<span>{{ subPart?.value || subPart }}</span>
					</template>
				</VErrorBoundary>
			</template>
		</template>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.render-template {
	block-size: 100%;
	position: relative;
	max-inline-size: 100%;
	padding-inline-end: 8px;
	@include mixins.no-wrap;

	.vertical-aligner {
		display: inline-block;
		inline-size: 0;
		block-size: 100%;
		vertical-align: middle;
	}

	> * {
		vertical-align: middle;
	}

	.render-template {
		display: inline;
	}
}

.render-template:has(.display-translations) {
	text-overflow: clip;
}

.subdued {
	color: var(--theme--foreground-subdued);
}
</style>
