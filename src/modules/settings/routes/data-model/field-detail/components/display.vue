<template>
	<div>
		<h2 class="type-title">{{ $t('display_setup_title') }}</h2>

		<v-fancy-select class="select" :items="selectItems" v-model="_field.system.display" />

		<template v-if="_field.system.display">
			<v-form
				v-if="
					selectedDisplay.options &&
					Array.isArray(selectedDisplay.options) &&
					selectedDisplay.options.length > 0
				"
				:fields="selectedDisplay.options"
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
import displays from '@/displays';
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
		const availabledisplays = computed(() =>
			displays.filter((display) => {
				const matchesType = display.types.includes(props.fieldData.database.type);
				const matchesRelation = true;

				// if (props.type === 'standard') {
				// 	matchesRelation = display.relationship === null || display.relationship === undefined;
				// } else if (props.type === 'file') {
				// 	matchesRelation = display.relationship === 'm2o';
				// } else if (props.type === 'files') {
				// 	matchesRelation = display.relationship === 'm2m';
				// } else {
				// 	matchesRelation = display.relationship === props.type;
				// }

				return matchesType && matchesRelation;
			})
		);

		const selectItems = computed(() =>
			availabledisplays.value.map((display) => ({
				text: display.name,
				value: display.id,
				icon: display.icon,
			}))
		);

		const selectedDisplay = computed(() => {
			return displays.find((display) => display.id === _field.value.system.display);
		});

		return { _field, selectItems, selectedDisplay };
	},
});
</script>

<style lang="scss" scoped>
.type-title,
.select {
	margin-bottom: 32px;
}
</style>
