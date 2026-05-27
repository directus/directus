<script setup lang="ts">
import type { DisplayConfig } from '@directus/extensions';
import { computed, inject, ref, watch } from 'vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useExtensions } from '@/extensions';

const props = defineProps<{
	value: string | null;
	typeField?: string;
}>();

const emit = defineEmits<{
	input: [value: string | null];
}>();

const { displays } = useExtensions();

const values = inject('values', ref<Record<string, any>>({}));

const selectedType = computed(() => {
	if (!props.typeField || !values.value[props.typeField]) return;
	return values.value[props.typeField];
});

watch(
	() => values.value[props.typeField!],
	() => {
		emit('input', null);
	},
);

const items = computed(() => {
	return displays.value
		.filter((display: DisplayConfig) => (display.localTypes?.length ?? 0) === 0)
		.filter((display: DisplayConfig) => selectedType.value === undefined || display.types.includes(selectedType.value))
		.map((display: DisplayConfig) => {
			return {
				text: display.name,
				value: display.id,
			};
		});
});
</script>

<template>
	<VNotice v-if="selectedType === undefined">
		{{ $t('select_field_type') }}
	</VNotice>
	<VSelect
		v-else
		:items="items"
		:model-value="value"
		:placeholder="$t('interfaces.system-display.placeholder')"
		show-deselect
		@update:model-value="$emit('input', $event)"
	/>
</template>
