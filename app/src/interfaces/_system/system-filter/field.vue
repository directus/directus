<template>
	<div>
        <v-field-select collection="article"></v-field-select>
    </div>
</template>

<script lang="ts">
import { Field } from './system-filter.vue';
import { defineComponent, PropType } from 'vue';
import systemDisplayTemplate from '../system-display-template/system-display-template.vue';

export default defineComponent({
    components: { systemDisplayTemplate },
    emits: ['change', 'input'],
	props: {
		field: {
			type: Object as PropType<Field>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		

		return { };
	},
});
</script>
