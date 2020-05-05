<template>
	<v-tab-item value="interface">
		<h2 class="title" v-if="isNew">{{ $t('interface_setup_title') }}</h2>
		<v-fancy-select :items="items" v-model="_interface" />
		<transition-expand>
			<v-form
				v-if="
					selectedInterface &&
					selectedInterface.options &&
					Array.isArray(selectedInterface.options)
				"
				:fields="selectedInterface.options"
				v-model="_options"
			/>
		</transition-expand>
	</v-tab-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync/';
import interfaces from '@/interfaces/';
import { FancySelectItem } from '@/components/v-fancy-select/types';

export default defineComponent({
	props: {
		interface: {
			type: String,
			default: null,
		},
		options: {
			type: Object as PropType<any>,
			default: null,
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const _interface = useSync(props, 'interface', emit);
		const _options = useSync(props, 'options', emit);

		const items = computed<FancySelectItem[]>(() => {
			return interfaces.map((inter) => ({
				text: inter.name,
				value: inter.id,
				icon: inter.icon,
			}));
		});

		const selectedInterface = computed(() => {
			return interfaces.find((inter) => inter.id === _interface.value) || null;
		});

		return { _interface, _options, items, selectedInterface };
	},
});
</script>

<style lang="scss" scoped>
.v-fancy-select {
	margin-bottom: 48px;
}
</style>
