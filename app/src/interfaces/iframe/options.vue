<template>
	<div class="grid">
		<div class="grid-element full">
			<p class="type-label">{{ t('interfaces.iframe.url_attribute') }}</p>
			<v-input v-model="urlAttribute" />
		</div>
		<div class="grid-element full">
			<p class="type-label">{{ t('interfaces.iframe.width_attribute') }}</p>
			<v-input v-model="widthAttribute" />
		</div>
		<div class="grid-element full">
			<p class="type-label">{{ t('interfaces.iframe.height_attribute') }}</p>
			<v-input v-model="heightAttribute" />
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
		const urlAttribute = computed({
			get() {
				return props.value?.urlAttribute ?? '';
			},
			set(val: string) {
				emit('input', {
					...(props.value || {}),
					urlAttribute: val,
				});
			},
		});
		const widthAttribute = computed({
			get() {
				return props.value?.widthAttribute ?? '800';
			},
			set(val: string) {
				emit('input', {
					...(props.value || {}),
					widthAttribute: val,
				});
			},
		});
		const heightAttribute = computed({
			get() {
				return props.value?.heightAttribute ?? '600';
			},
			set(val: string) {
				emit('input', {
					...(props.value || {}),
					heightAttribute: val,
				});
			},
		});
		return { t, urlAttribute, widthAttribute, heightAttribute };
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
