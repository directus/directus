<template>
	<div>
		<h2 class="type-title">{{ $t('interface_setup_title') }}</h2>

		<v-fancy-select class="select" :items="selectItems" v-model="fieldData.system.interface" />

		<v-notice class="not-found" type="danger" v-if="fieldData.system.interface && !selectedInterface">
			{{ $t('interface_not_found', { interface: fieldData.system.interface }) }}
			<div class="spacer" />
			<button @click="fieldData.system.interface = null">{{ $t('reset_interface') }}</button>
		</v-notice>

		<template v-if="fieldData.system.interface && selectedInterface">
			<v-form
				v-if="
					selectedInterface.options &&
					Array.isArray(selectedInterface.options) &&
					selectedInterface.options.length > 0
				"
				:fields="selectedInterface.options"
				primary-key="+"
				v-model="fieldData.system.options"
			/>

			<v-notice v-else>
				{{ $t('no_options_available') }}
			</v-notice>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import interfaces from '@/interfaces';

import { state } from '../store';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const availableInterfaces = computed(() =>
			interfaces.filter((inter) => {
				const matchesType = inter.types.includes(state.fieldData?.type || 'alias');
				let matchesRelation = false;

				if (props.type === 'standard') {
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
		);

		const selectItems = computed(() =>
			availableInterfaces.value.map((inter) => ({
				text: inter.name,
				value: inter.id,
				icon: inter.icon,
			}))
		);

		const selectedInterface = computed(() => {
			return interfaces.find((inter) => inter.id === state.fieldData.system.interface);
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
