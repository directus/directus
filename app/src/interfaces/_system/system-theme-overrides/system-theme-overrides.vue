<script setup lang="ts">
import { Theme, ThemeSchema } from '@directus/themes';
import { clone, setWith } from 'lodash';
import SystemThemeOverridesGroup from './system-theme-overrides-group.vue';
import type { GroupValue, SetValueFn } from './types.js';

defineOptions({
	inheritAttrs: false,
});

const props = defineProps<{
	value: GroupValue | null;
}>();

const emit = defineEmits<{
	input: [Partial<Theme> | null];
}>();

const set: SetValueFn = (path: string[], value: string | number | undefined) => {
	emit('input', setWith(clone(props.value ?? {}), path, value, clone));
};
</script>

<template>
	<div class="theme-overrides">
		<SystemThemeOverridesGroup
			root
			:schema="ThemeSchema.properties.rules"
			:path="[]"
			:value="value ?? {}"
			:set="set"
		/>
	</div>
</template>

<style scoped lang="scss">
.theme-overrides {
	border: 2px solid var(--border-normal);
	padding: 12px;
	border-radius: var(--border-radius);
}
</style>
