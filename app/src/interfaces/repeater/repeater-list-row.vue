<template>
	<v-item class="row" v-slot:default="{ toggle }" :active="false" :watch="false">
		<div :class="{ subdued: !displayValue }" class="header type-text" @click="toggle">
			<v-icon v-if="disabled === false" name="drag_handle" class="drag-handle" />
			{{ displayValue ? displayValue : placeholder }}
			<span class="spacer" />
			<v-icon v-if="disabled === false" name="close" class="delete" @click.stop.prevent="$emit('delete')" />
		</div>
	</v-item>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from '@vue/composition-api';
import i18n from '@/lang';
import renderTemplate from '@/utils/render-template';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<Record<string, any>>,
			default: () => [],
		},
		template: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: i18n.t('empty_item'),
		},
	},
	setup(props) {
		const { value, template } = toRefs(props);

		const { displayValue } = renderTemplate(template, value);

		return { displayValue };
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
