<template>
	<div>
		<h2 class="type-title">{{ $t('display_setup_title') }}</h2>

		<v-fancy-select class="select" :items="selectItems" v-model="fieldData.meta.display" />

		<v-notice class="not-found" type="danger" v-if="fieldData.meta.display && !selectedDisplay">
			{{ $t('display_not_found', { display: fieldData.meta.display }) }}
			<div class="spacer" />
			<button @click="fieldData.meta.display = null">{{ $t('reset_display') }}</button>
		</v-notice>

		<template v-if="fieldData.meta.display && selectedDisplay">
			<v-notice v-if="!selectedDisplay.options">
				{{ $t('no_options_available') }}
			</v-notice>

			<v-form
				v-else-if="Array.isArray(selectedDisplay.options)"
				:fields="selectedDisplay.options"
				primary-key="+"
				v-model="fieldData.meta.display_options"
			/>

			<component v-model="fieldData" :is="`display-options-${selectedDisplay.id}`" v-else />
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { getDisplays } from '@/displays';

import { state } from '../store';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const displays = getDisplays();
		const availableDisplays = computed(() =>
			displays.value.filter((display) => {
				const matchesType = display.types.includes(state.fieldData?.type || 'alias');
				const matchesRelation = true;
				return matchesType && matchesRelation;
			})
		);

		const selectItems = computed(() =>
			availableDisplays.value.map((display) => ({
				text: display.name,
				value: display.id,
				icon: display.icon,
			}))
		);

		const selectedDisplay = computed(() => {
			return displays.value.find((display) => display.id === state.fieldData.meta.display);
		});

		return { fieldData: state.fieldData, selectItems, selectedDisplay };
	},
});
</script>

<style lang="scss" scoped>
.type-title,
.select {
	margin-bottom: 32px;
}
</style>
