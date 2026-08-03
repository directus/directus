<script setup lang="ts">
import { toRefs, computed } from 'vue';
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

const isArrayValue = computed(() => Array.isArray(props.value));
</script>

<template>
	<ValueNull v-if="value === null || value === undefined" />
	<template v-else-if="isArrayValue">
		<span
			v-for="(item, index) in (value as unknown[])"
			:key="index"
			class="display"
		>
			<span v-if="index > 0" class="separator">, </span>
			<ValueNull v-if="item === null || item === undefined" />
			<VTextOverflow v-else-if="displayInfo === null" :text="item" />
			<VErrorBoundary v-else :name="`display-${display}`">
				<component
					:is="`display-${display}`"
					v-bind="options"
					:interface="interface"
					:interface-options="interfaceOptions"
					:value="item"
					:type="type"
					:collection="collection"
					:field="field"
				/>
				<template #fallback>
					<VTextOverflow :text="item" />
				</template>
			</VErrorBoundary>
		</span>
	</template>
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
	line-height: 1.25rem;
}

.separator {
	white-space: pre;
}
</style>