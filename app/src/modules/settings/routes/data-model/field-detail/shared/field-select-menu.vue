<template>
	<v-menu :show-arrow="showArrow" :attached="attached" :placement="placement">
		<template #activator="{ toggle, activate, deactivate }">
			<slot name="activator" :toggle="toggle" :activate="activate" :deactivate="deactivate" />
		</template>

		<v-list v-if="filteredFields?.length > 0" class="monospace">
			<v-list-item
				v-for="field in filteredFields"
				:key="field.value"
				:active="modelValue === field.value"
				:disabled="field.disabled"
				clickable
				@click="$emit('update:modelValue', field.value)"
			>
				<v-list-item-content>
					{{ field.text }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts" setup>
import type { Field } from '@directus/shared/types';
import type { Placement } from '@popperjs/core';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		showArrow?: boolean;
		attached?: boolean;
		placement?: Placement;
		fields: { text: string; value: string; disabled: boolean }[];
		filter?: string | null;
		modelValue: string;
	}>(),
	{
		showArrow: false,
		attached: false,
		placement: 'bottom',
		filter: null,
	}
);

defineEmits<{
	(e: 'update:modelValue', field: Field): void;
}>();

const filteredFields = computed(() =>
	props.filter ? props.fields.filter(({ value }) => value.startsWith(props.filter!)) : props.fields
);
</script>

<style lang="scss" scoped>
.monospace {
	--v-list-item-content-font-family: var(--family-monospace);
}
</style>
