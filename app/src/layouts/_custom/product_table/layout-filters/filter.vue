<template>
	<div>
		<form-field :value="filter.value" :field="_field" @input="emitFilter" @unset="$emit('unset', _field.field)" />
	</div>
</template>
<script lang="ts">
import { Field, Filter } from '@/types';
import { computed, defineComponent, PropType } from '@vue/composition-api';

import FormField from '@/components/v-form/form-field.vue';

export default defineComponent({
	components: {
		FormField,
	},
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: () => ({}),
		},
	},
	setup(props, { emit }) {
		const _field = computed<Field>(() => {
			delete props.field.schema?.default_value;

			return props.field;
		});

		function emitFilter(value: string) {
			emit('input', value);
		}

		return {
			_field,
			emitFilter,
		};
	},
});
</script>
