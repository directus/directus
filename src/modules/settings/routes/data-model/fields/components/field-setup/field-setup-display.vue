<template>
	<v-tab-item value="display">
		<h2 class="title" v-if="isNew">{{ $t('display_setup_title') }}</h2>
		<v-fancy-select :items="items" v-model="_display" />
		<transition-expand>
			<v-form
				v-if="
					selectedDisplay &&
					selectedDisplay.options &&
					Array.isArray(selectedDisplay.options)
				"
				:fields="selectedDisplay.options"
				v-model="_options"
			/>
		</transition-expand>
	</v-tab-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync/';
import displays from '@/displays/';
import { FancySelectItem } from '@/components/v-fancy-select/types';

export default defineComponent({
	props: {
		display: {
			type: String,
			default: null,
		},
		options: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: Object as PropType<any>,
			default: null,
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const _display = useSync(props, 'display', emit);
		const _options = useSync(props, 'options', emit);

		const items = computed<FancySelectItem[]>(() => {
			return displays.map((display) => ({
				text: display.name,
				value: display.id,
				icon: display.icon,
			}));
		});

		const selectedDisplay = computed(() => {
			return displays.find((display) => display.id === _display.value) || null;
		});

		return { _display, _options, items, selectedDisplay };
	},
});
</script>

<style lang="scss" scoped>
.v-fancy-select {
	margin-bottom: 48px;
}
</style>
