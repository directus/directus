<template>
	<v-notice v-if="!selectedInterface">
		{{ $t('select_interface') }}
	</v-notice>

	<v-notice v-else-if="!selectedInterface.options">
		{{ $t('no_options_available') }}
	</v-notice>

	<div class="inset" v-else>
		<v-form
			v-if="Array.isArray(selectedInterface.options)"
			:fields="selectedInterface.options"
			primary-key="+"
			:edits="value"
			@input="$listeners.input"
		/>

		<component
			:value="value"
			@input="$listeners.input"
			:field-data="fieldData"
			:is="`interface-options-${selectedInterface.id}`"
			v-else
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, ref } from '@vue/composition-api';
import { getInterfaces } from '@/interfaces';

export default defineComponent({
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
	setup(props, { parent }) {
		const { interfaces } = getInterfaces();

		const values = inject('values', ref<Record<string, any>>({}));

		const selectedInterface = computed(() => {
			if (!values.value[props.interfaceField]) return;

			return interfaces.value.find((inter) => inter.id === values.value[props.interfaceField]);
		});

		return { selectedInterface, values };
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
