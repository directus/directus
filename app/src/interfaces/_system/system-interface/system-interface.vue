<script setup lang="ts">
import type { InterfaceConfig } from '@directus/extensions';
import { computed, inject, ref, watch } from 'vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useExtensions } from '@/extensions';

const props = defineProps<{
	value: string | null;
	typeField?: string;
}>();

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { interfaces } = useExtensions();

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
	return interfaces.value
		.filter((inter: InterfaceConfig) => inter.relational !== true && inter.system !== true)
		.filter((inter: InterfaceConfig) => selectedType.value === undefined || inter.types.includes(selectedType.value))
		.map((inter: InterfaceConfig) => {
			return {
				text: inter.name,
				value: inter.id,
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
		:placeholder="$t('interfaces.system-interface.placeholder')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
