<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.cards.image_source') }}</div>
		<v-select v-model="imageSource" show-deselect item-value="field" item-text="name" :items="fileFields" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.cards.title') }}</div>
		<v-field-template :collection="props.collection" v-model="title" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.cards.subtitle') }}</div>
		<v-field-template :collection="props.collection" v-model="subtitle" />
	</div>

	<v-detail class="field">
		<template #title>{{ t('layout_setup') }}</template>

		<div class="nested-options">
			<div class="field">
				<div class="type-label">{{ t('layouts.cards.image_fit') }}</div>
				<v-select
					v-model="imageFit"
					:disabled="imageSource === null"
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
				<interface-select-icon :value="icon" @input="icon = $event" />
			</div>
		</div>
	</v-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { props, imageSource, fileFields, title, subtitle, imageFit, icon } = toRefs(layoutState.value);

		return { t, props, imageSource, fileFields, title, subtitle, imageFit, icon };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.nested-options {
	@include form-grid;
}
</style>
