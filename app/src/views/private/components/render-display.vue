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

<script setup lang="ts">
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

<style lang="scss" scoped>
.display {
	line-height: 22px;
}
</style>
