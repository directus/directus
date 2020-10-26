<template>
	<v-item class="row" v-slot:default="{ active, toggle }" :active="initialActive" :watch="false">
		<repeater-row-header
			:template="template"
			:value="value"
			:active="active"
			:toggle="toggle"
			@delete="$emit('delete')"
			:disabled="disabled"
			:placeholder="headerPlaceholder"
		/>
		<transition-expand>
			<div v-if="active">
				<repeater-row-form
					:disabled="disabled"
					:fields="fields"
					:value="value"
					@input="$emit('input', $event)"
				/>
			</div>
		</transition-expand>
	</v-item>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Field } from '@/types';
import RepeaterRowHeader from './repeater-row-header.vue';
import RepeaterRowForm from './repeater-row-form.vue';

export default defineComponent({
	components: { RepeaterRowHeader, RepeaterRowForm },
	props: {
		value: {
			type: Object,
			default: null,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		initialActive: {
			type: Boolean,
			default: false,
		},
		template: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		headerPlaceholder: {
			type: String,
			default: null,
		},
	},
});
</script>

<style lang="scss" scoped>
.row {
	background-color: var(--background-subdued);
	border: 2px solid var(--border-subdued);
	border-radius: var(--border-radius);

	& + .row {
		margin-top: 8px;
	}

	.repeater {
		.row {
			background-color: var(--background-page);
			border-color: var(--border-normal);
		}
	}
}
</style>
