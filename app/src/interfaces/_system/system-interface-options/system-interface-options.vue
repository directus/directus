<template>
	<v-notice v-if="!selectedInterface">
		{{ t('select_interface') }}
	</v-notice>

	<v-notice v-else-if="!selectedInterface.options">
		{{ t('no_options_available') }}
	</v-notice>

	<div class="inset" v-else>
		<v-form
			v-if="Array.isArray(selectedInterface.options)"
			:fields="selectedInterface.options"
			primary-key="+"
			:model-value="value"
			@update:model-value="$emit('input', $event)"
		/>

		<component
			:value="value"
			@input="$emit('input', $event)"
			:field-data="fieldData"
			:is="`interface-options-${selectedInterface.id}`"
			v-else
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, inject, ref } from 'vue';
import { getInterfaces } from '@/interfaces';
import { InterfaceConfig } from '@/interfaces/types';

export default defineComponent({
	emits: ['input'],
	props: {
		value: {
			type: Object,
			default: null,
		},
		interfaceField: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const { interfaces } = getInterfaces();

		const values = inject('values', ref<Record<string, any>>({}));

		const selectedInterface = computed(() => {
			if (!values.value[props.interfaceField]) return;

			return interfaces.value.find((inter: InterfaceConfig) => inter.id === values.value[props.interfaceField]);
		});

		return { t, selectedInterface, values };
	},
});
</script>

<style lang="scss" scoped>
.inset {
	padding: 8px;
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}
</style>
