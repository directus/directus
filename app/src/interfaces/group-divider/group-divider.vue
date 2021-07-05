<template>
	<v-detail>
		<template #activator="{ toggle, active }">
			<v-divider
				:class="{ margin: icon || title, active }"
				:style="{
					'--v-divider-label-color': color,
				}"
				large
				:inline-title="inlineTitle"
				@click="toggle"
			>
				<template v-if="icon" #icon><v-icon :name="icon" /></template>
				<template v-if="title">
					<div class="title">
						<span class="name">{{ title }}</span>
						<v-icon :name="active ? 'unfold_less' : 'unfold_more'" />
					</div>
				</template>
			</v-divider>
		</template>

		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta.id"
			:validation-errors="validationErrors"
			:loading="loading"
			@update:model-value="$emit('apply', $event)"
		/>
	</v-detail>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Field, ValidationError } from '@/types';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
		inlineTitle: {
			type: Boolean,
			default: false,
		},

		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		values: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		initialValues: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActiveFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
	},
});
</script>

<style scoped>
.margin {
	margin-top: 20px;
}

.title {
	display: flex;
	align-items: center;
}

.name {
	flex-grow: 1;
}

.v-divider {
	cursor: pointer;
}

.v-form {
	padding-top: var(--form-vertical-gap);
}
</style>
