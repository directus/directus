<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.cards.image_source') }}</div>
		<v-select
			v-model="layoutState.imageSource"
			show-deselect
			item-value="field"
			item-text="name"
			:items="layoutState.fileFields"
		/>
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.cards.title') }}</div>
		<v-field-template :collection="layoutState.props.collection" v-model="layoutState.title" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.cards.subtitle') }}</div>
		<v-field-template :collection="layoutState.props.collection" v-model="layoutState.subtitle" />
	</div>

	<v-detail class="field">
		<template #title>{{ t('layout_setup') }}</template>

		<div class="nested-options">
			<div class="field">
				<div class="type-label">{{ t('layouts.cards.image_fit') }}</div>
				<v-select
					v-model="layoutState.imageFit"
					:disabled="layoutState.imageSource === null"
					:items="[
						{
							text: t('layouts.cards.crop'),
							value: 'crop',
						},
						{
							text: t('layouts.cards.contain'),
							value: 'contain',
						},
					]"
				/>
			</div>

			<div class="field">
				<div class="type-label">{{ t('fallback_icon') }}</div>
				<interface-select-icon :value="layoutState.icon" @input="layoutState.icon = $event" />
			</div>
		</div>
	</v-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();

		return { t, layoutState };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.nested-options {
	@include form-grid;
}
</style>
