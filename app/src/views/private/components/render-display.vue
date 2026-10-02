<script setup lang="ts">
import { computed, toRefs } from 'vue';
import ValueNull from './value-null.vue';
import VErrorBoundary from '@/components/v-error-boundary.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useExtension } from '@/composables/use-extension';

const props = defineProps<{
	display: string | null;
	options?: Record<string, unknown>;
	interface?: string;
	interfaceOptions?: Record<string, unknown>;
	value?: string | number | boolean | Record<string, unknown> | unknown[];
	type: string;
	collection: string;
	field: string;
}>();

const { display } = toRefs(props);

const displayInfo = useExtension('display', display);

// Field types whose display components expect the array as a single value, instead of one
// value per entry. Nested fields resolved through a to-many relation arrive as an array, while
// the display of a scalar field (datetime as an example) can only render a single value.
const ARRAY_DISPLAY_TYPES = ['alias', 'json'];

const values = computed<unknown[]>(() => {
	if (Array.isArray(props.value) && ARRAY_DISPLAY_TYPES.includes(props.type) === false) {
		return props.value;
	}

	return [props.value];
});
</script>

<template>
	<ValueNull v-if="value === null || value === undefined || values.length === 0" />
	<VTextOverflow v-else-if="displayInfo === null" class="display" :text="value" />
	<template v-else>
		<template v-for="(valueItem, index) in values" :key="index">
			<span v-if="index > 0">,&nbsp;</span>
			<VErrorBoundary :name="`display-${display}`">
				<component
					:is="`display-${display}`"
					v-bind="options"
					:interface="interface"
					:interface-options="interfaceOptions"
					:value="valueItem"
					:type="type"
					:collection="collection"
					:field="field"
				/>

				<template #fallback>
					<VTextOverflow class="display" :text="valueItem" />
				</template>
			</VErrorBoundary>
		</template>
	</template>
</template>

<style lang="scss" scoped>
.display {
	line-height: 1.25rem;
}
</style>
