<template>
	<div class="grid">
		<div class="field">
			<div class="type-label">{{ t('layouts.tabular.spacing') }}</div>
			<v-select
				v-model="options.tableSpacing"
				:items="[
					{
						text: t('layouts.tabular.compact'),
						value: 'compact',
					},
					{
						text: t('layouts.tabular.cozy'),
						value: 'cozy',
					},
					{
						text: t('layouts.tabular.comfortable'),
						value: 'comfortable',
					},
				]"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<any>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const options = computed({
			get() {
				return props.value || {};
			},
			set(options: Record<string, unknown>) {
				emit('input', options);
			},
		});
		return { t, options };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;

	&-element {
		&.full {
			grid-column: start/full;
		}
	}
}
</style>
