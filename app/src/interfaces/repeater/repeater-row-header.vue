<template>
	<div :class="{ subdued: !displayValue }" class="header type-text" @click="toggle">
		<v-icon v-if="disabled === false" name="drag_handle" class="drag-handle" />
		{{ displayValue ? displayValue : placeholder }}
		<span class="spacer" />
		<v-icon v-if="disabled === false" name="close" class="delete" @click.stop.prevent="$emit('delete')" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { render } from 'micromustache';
import i18n from '@/lang';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';

export default defineComponent({
	props: {
		value: {
			type: Object,
			default: null,
		},
		template: {
			type: String,
			required: true,
		},
		placeholder: {
			type: String,
			default: null,
		},
		toggle: {
			type: Function,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const fieldsInTemplate = computed(() => getFieldsFromTemplate(props.template));
		const displayValue = computed(() => {
			if (!props.value) return;

			for (const [key, value] of Object.entries(props.value)) {
				if (fieldsInTemplate.value.includes(key) === false) continue;

				if (value === undefined) return null;
			}

			return render(props.template, props.value);
		});

		return { displayValue };
	},
});
</script>

<style lang="scss" scoped>
.header {
	display: flex;
	align-items: center;
	padding: 12px;
	cursor: pointer;
}

.spacer {
	flex-grow: 1;
}

.subdued {
	color: var(--foreground-subdued);
}

.v-icon {
	--v-icon-color: var(--foreground-subdued);
}

.drag-handle {
	margin-right: 8px;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}

.delete:hover {
	--v-icon-color: var(--danger);
}
</style>
