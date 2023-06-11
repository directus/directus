<script setup lang="ts">
// import { useObjectProperty } from '@directus/composables';
import { useI18n } from 'vue-i18n';
import type { LayoutOptions } from './types';
import { computed, unref } from 'vue';

defineOptions({ inheritAttrs: false });

const { t } = useI18n();

const layoutOptions = defineModel<LayoutOptions>({
	required: true,
});

const spacing = computed({
	get() {
		return unref(layoutOptions).spacing;
	},
	set(val) {
		layoutOptions.value = {
			...layoutOptions.value,
			spacing: val,
		};
	},
});
</script>

<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.tabular.spacing') }}</div>
		<v-select
			v-model="spacing"
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
</template>
