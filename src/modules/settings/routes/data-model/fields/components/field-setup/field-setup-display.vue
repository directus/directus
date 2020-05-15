<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('display_setup_title') }}</h2>

		<v-fancy-select
			:items="items"
			:value="value.display"
			@input="emitValue('display', $event)"
		/>

		<v-form
			v-if="
				selectedDisplay && selectedDisplay.options && Array.isArray(selectedDisplay.options)
			"
			:fields="selectedDisplay.options"
			primary-key="+"
			:edits="value.options"
			@input="emitValue('options', $event)"
		/>

		<v-notice v-else>
			{{ $t('no_options_available') }}
		</v-notice>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import displays from '@/displays/';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Field } from '@/stores/fields/types';

export default defineComponent({
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Object as PropType<Field>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const items = computed<FancySelectItem[]>(() => {
			return displays.map((inter) => ({
				text: inter.name,
				value: inter.id,
				icon: inter.icon,
			}));
		});

		const selectedDisplay = computed(() => {
			return displays.find((inter) => inter.id === props.value.display) || null;
		});

		return { emitValue, items, selectedDisplay };

		function emitValue(key: string, value: any) {
			emit('input', {
				...props.value,
				[key]: value,
			});
		}
	},
});
</script>

<style lang="scss" scoped>
.v-fancy-select {
	margin-bottom: 48px;
}
</style>
