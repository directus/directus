<template>
	<div
		class="interface"
		:class="{
			subdued: batchMode && batchActive === false,
		}"
		ref="interfaceEl"
	>
		<v-skeleton-loader v-if="loading && field.hideLoader !== true" />

		<component
			v-if="interfaceExists"
			:is="
				field.meta && field.meta.interface
					? `interface-${field.meta.interface}`
					: `interface-${getDefaultInterfaceForType(field.type)}`
			"
			v-bind="(field.meta && field.meta.options) || {}"
			:disabled="disabled"
			:value="value === undefined ? field.schema.default_value : value"
			:width="selectSize"
			:type="field.type"
			:collection="field.collection"
			:field="field.field"
			:primary-key="primaryKey"
			:length="field.schema && field.schema.max_length"
			@input="$emit('input', $event)"
		/>

		<v-notice v-else type="warning">
			{{ $t('interface_not_found', { interface: field.meta && field.meta.interface }) }}
		</v-notice>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { Field } from '@/types';
import { getInterfaces } from '@/interfaces';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { useElementSize } from '../../composables/use-element-size';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActive: {
			type: Boolean,
			default: false,
		},
		primaryKey: {
			type: [Number, String],
			default: null,
		},
		value: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const interfaceEl = ref<Element | null>(null);

		const interfaces = getInterfaces();

		const interfaceExists = computed(() => {
			return !!interfaces.value.find((inter) => inter.id === props.field?.meta?.interface || 'text-input');
		});

		const { width } = useElementSize(interfaceEl);

		const sizeClass = computed<string | null>(() => {
			if (interfaceEl.value === null) return 'half'; // Fallback

			if (width.value > 576) {
				return 'full';
			} else {
				return 'half';
			}

			return 'half'; // Fallback
		});

		const selectSize = computed<string | null>(() => {
			const givenWidth = (props.field.meta && props.field.meta.width) || 'full';

			// If the static givenWidth (half or full) is `full`, overwrite it on small screens
			// Otherwise just pass the static givenWidth along
			return givenWidth === 'full' ? sizeClass.value : givenWidth;
		});

		return { interfaceExists, getDefaultInterfaceForType, interfaceEl, selectSize };
	},
});
</script>

<style lang="scss" scoped>
.interface {
	position: relative;

	.v-skeleton-loader {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 2;
		width: 100%;
		height: 100%;
	}

	&.subdued {
		opacity: 0.5;
	}
}
</style>
