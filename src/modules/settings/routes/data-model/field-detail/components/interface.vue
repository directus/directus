<template>
	<div>
		<h2 class="type-title">{{ $t('interface_setup_title') }}</h2>

		<v-fancy-select class="select" :items="selectItems" v-model="_field.system.interface" />

		<template v-if="_field.system.interface">
			<v-form
				v-if="
					selectedInterface.options &&
					Array.isArray(selectedInterface.options) &&
					selectedInterface.options.length > 0
				"
				:fields="selectedInterface.options"
				primary-key="+"
				v-model="_field.system.options"
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
import useSync from '@/composables/use-sync';

export default defineComponent({
	props: {
		fieldData: {
			type: Object,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _field = useSync(props, 'fieldData', emit);
		const availableInterfaces = computed(() =>
			interfaces.filter((inter) => {
				const matchesType = inter.types.includes(props.fieldData.database?.type || 'alias');
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
			return interfaces.find((inter) => inter.id === _field.value.system.interface);
		});

		return { _field, selectItems, selectedInterface };
	},
});
</script>

<style lang="scss" scoped>
.type-title,
.select {
	margin-bottom: 32px;
}
</style>
