<script setup lang="ts">
import VSelect from '@/components/v-select/v-select.vue';
import type { TObject, TRef } from '@sinclair/typebox';
import { difference } from 'lodash';
import { computed, unref } from 'vue';
import SystemThemeOverridesRule from './system-theme-overrides-rule.vue';
import type { GroupValue, SetValueFn } from './types.js';

defineOptions({
	name: 'SystemThemeOverridesGroup',
	inheritAttrs: false,
});

const props = defineProps<{
	schema: TObject<{ [key: string]: TObject | TRef }>;
	root?: boolean;
	rule?: string;
	value: GroupValue;
	path: string[];
	set: SetValueFn;
}>();

const allProperties = computed(() => Object.keys(props.schema.properties));
const usedProperties = computed(() => Object.keys(props.value));
const availableProperties = computed(() => difference(unref(allProperties), unref(usedProperties)));

const addProperty = (key: string) => props.set([...props.path, key], undefined);

const getNested = (key: string) => {
	const nested = props.schema.properties[key];

	if (!nested || !nested.type || nested.type !== 'object') {
		throw new Error(`Nested schema for ${key} can't be extracted from schema ${props.schema}`);
	}

	return nested as TObject<{ [key: string]: TObject | TRef }>;
};

const isGroup = (key: string) => {
	try {
		getNested(key);
		return true;
	} catch (err) {
		return false;
	}
};
</script>

<template>
	<div class="theme-overrides-group" :class="{ root }">
		<p class="rule">{{ rule }}</p>

		<div class="group-contents">
			<template v-for="child in Object.keys(value)" :key="child">
				<system-theme-overrides-group
					v-if="isGroup(child)"
					:rule="child"
					:value="(value[child] as GroupValue) ?? {}"
					:set="set"
					:schema="getNested(child)"
					:path="[...path, child]"
				/>
				<system-theme-overrides-rule
					v-else
					:rule="child"
					type="color"
					:set="set"
					:value="(value[child] as string | number | undefined)"
					:path="[...path, child]"
				/>
			</template>

			<v-select
				v-if="availableProperties.length > 0"
				class="select"
				placeholder="Add Rule"
				:items="availableProperties"
				inline
				@update:model-value="addProperty"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.theme-overrides-group {
	&:not(.root) {
		.group-contents {
			padding-left: 2ch;
			border-left: 1px solid var(--border-subdued);
		}
	}
}

.rule {
	font-family: var(--family-monospace);
}
</style>
