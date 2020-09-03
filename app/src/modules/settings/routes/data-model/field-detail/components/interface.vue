<template>
	<div>
		<h2 class="type-title">{{ $t('interface_setup_title') }}</h2>

		<v-fancy-select class="select" :items="selectItems" v-model="fieldData.meta.interface" />

		<v-notice class="not-found" type="danger" v-if="fieldData.meta.interface && !selectedInterface">
			{{ $t('interface_not_found', { interface: fieldData.meta.interface }) }}
			<div class="spacer" />
			<button @click="fieldData.meta.interface = null">{{ $t('reset_interface') }}</button>
		</v-notice>

		<template v-if="fieldData.meta.interface && selectedInterface">
			<v-notice v-if="!selectedInterface.options">
				{{ $t('no_options_available') }}
			</v-notice>

			<v-form
				v-else-if="Array.isArray(selectedInterface.options)"
				:fields="selectedInterface.options"
				primary-key="+"
				v-model="fieldData.meta.options"
			/>

			<component
				v-model="fieldData.meta.options"
				:field-data="fieldData"
				:is="`interface-options-${selectedInterface.id}`"
				v-else
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { getInterfaces } from '@/interfaces';
import { FancySelectItem } from '@/components/v-fancy-select/types';

import { state } from '../store';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const interfaces = getInterfaces();

		const availableInterfaces = computed(() => {
			return interfaces.value
				.filter((inter) => {
					// Filter out all system interfaces
					if (inter.system !== undefined && inter.system === true) return false;

					const matchesType = inter.types.includes(state.fieldData?.type || 'alias');
					let matchesRelation = false;

					if (props.type === 'standard' || props.type === 'presentation') {
						matchesRelation = inter.relationship === null || inter.relationship === undefined;
					} else if (props.type === 'file') {
						matchesRelation = inter.relationship === 'm2o';
					} else if (props.type === 'files') {
						matchesRelation = inter.relationship === 'm2m';
					} else {
						matchesRelation = inter.relationship === props.type;
					}

					return matchesType && matchesRelation;
				})
				.sort((a, b) => (a.name > b.name ? 1 : -1));
		});

		const selectItems = computed(() => {
			const type: string = state.fieldData?.type || 'alias';

			const recommendedInterfacesPerType: { [type: string]: string[] } = {
				string: ['text-input', 'dropdown'],
				text: ['wysiwyg'],
				boolean: ['toggle'],
				integer: ['numeric'],
				bigInteger: ['numeric'],
				float: ['numeric'],
				decimal: ['numeric'],
				timestamp: ['datetime'],
				datetime: ['datetime'],
				date: ['datetime'],
				time: ['datetime'],
				json: ['code'],
				uuid: ['text-input'],
			};

			const recommended = recommendedInterfacesPerType[type] || [];

			const interfaceItems: FancySelectItem[] = availableInterfaces.value.map((inter) => {
				const item: FancySelectItem = {
					text: inter.name,
					description: inter.description,
					value: inter.id,
					icon: inter.icon,
				};

				if (recommended.includes(item.value as string)) {
					item.iconRight = 'star';
				}

				return item;
			});

			if (interfaceItems.length >= 5 && recommended.length > 0) {
				return [
					...recommended.map((key) => interfaceItems.find((item) => item.value === key)),
					{ divider: true },
					...interfaceItems.filter((item) => recommended.includes(item.value as string) === false),
				];
			} else {
				return interfaceItems;
			}
		});

		const selectedInterface = computed(() => {
			return interfaces.value.find((inter) => inter.id === state.fieldData.meta.interface);
		});

		return { fieldData: state.fieldData, selectItems, selectedInterface };
	},
});
</script>

<style lang="scss" scoped>
.type-title,
.select {
	margin-bottom: 32px;
}

.not-found {
	.spacer {
		flex-grow: 1;
	}

	button {
		text-decoration: underline;
	}
}
</style>
