<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('interface_setup_title') }}</h2>

		<v-fancy-select :items="items" :value="value.interface" @input="setInterface" />

		<template v-if="selectedInterface">
			<v-form
				v-if="
					selectedInterface.options &&
					Array.isArray(selectedInterface.options) &&
					selectedInterface.options.length > 0
				"
				:fields="selectedInterface.options"
				primary-key="+"
				:edits="value.options"
				@input="emitValue('options', $event)"
			/>

			<v-notice v-else>
				{{ $t('no_options_available') }}
			</v-notice>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import interfaces from '@/interfaces/';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Field } from '@/stores/fields/types';
import { LocalType } from './types';
import { localTypeGroups } from './index';

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
		localType: {
			type: String as PropType<LocalType>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const items = computed<FancySelectItem[]>(() => {
			return (
				interfaces
					// Filter interfaces based on the localType that was selected
					.filter((inter) => {
						return inter.types.some((type) => localTypeGroups[props.localType].includes(type));
					})
					.filter((inter) => {
						if (props.value.type && props.isNew === false) {
							return inter.types.includes(props.value.type);
						}

						return true;
					})
					.map((inter) => ({
						text: inter.name,
						value: inter.id,
						icon: inter.icon,
					}))
			);
		});

		const selectedInterface = computed(() => {
			return interfaces.find((inter) => inter.id === props.value.interface) || null;
		});

		return { emitValue, items, selectedInterface, setInterface };

		function setInterface(value: string | null) {
			if (value === null) {
				return emit('input', {
					...props.value,
					interface: null,
				});
			}

			const chosenInterface = interfaces.find((inter) => inter.id === value);

			if (!chosenInterface) return;

			// This also presets the field type
			emit('input', {
				...props.value,
				interface: value,
				type: chosenInterface.types[0],
			});
		}

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
