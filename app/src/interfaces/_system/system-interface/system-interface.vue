<template>
	<v-notice v-if="selectedType === undefined">
		{{ t('select_field_type') }}
	</v-notice>
	<v-select
		v-else
		:items="items"
		:model-value="value"
		:placeholder="t('interfaces.system-interface.placeholder')"
		@update:model-value="$emit('input', $event)"
	/>
</template>

<script setup lang="ts">
import { useExtensions } from '@/extensions';
import { InterfaceConfig } from '@directus/types';
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	typeField?: string;
}>();

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

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
	}
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
