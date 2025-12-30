<script setup lang="ts">
import ValueNull from './value-null.vue';
import VErrorBoundary from '@/components/v-error-boundary.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useExtension } from '@/composables/use-extension';
import { toRefs } from 'vue';

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
</script>

<template>
	<ValueNull v-if="value === null || value === undefined" />
	<VTextOverflow v-else-if="displayInfo === null" class="display" :text="value" />
	<VErrorBoundary v-else :name="`display-${display}`">
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
			<VTextOverflow class="display" :text="value" />
		</template>
	</VErrorBoundary>
</template>

<style lang="scss" scoped>
.display {
	line-height: 22px;
}
</style>
