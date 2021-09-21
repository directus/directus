<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.cards.image_source') }}</div>
		<v-select v-model="imageSourceWritable" show-deselect item-value="field" item-text="name" :items="fileFields" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.cards.title') }}</div>
		<v-field-template v-model="titleWritable" :collection="collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.cards.subtitle') }}</div>
		<v-field-template v-model="subtitleWritable" :collection="collection" />
	</div>

</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';

import { Field } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
		fileFields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		imageSource: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
		subtitle: {
			type: String,
			default: null,
		},
		imageFit: {
			type: String,
			required: true,
		},
	},
	emits: ['update:icon', 'update:imageSource', 'update:title', 'update:subtitle', 'update:imageFit'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const iconWritable = useSync(props, 'icon', emit);
		const imageSourceWritable = useSync(props, 'imageSource', emit);
		const titleWritable = useSync(props, 'title', emit);
		const subtitleWritable = useSync(props, 'subtitle', emit);
		const imageFitWritable = useSync(props, 'imageFit', emit);

		return { t, iconWritable, imageSourceWritable, titleWritable, subtitleWritable, imageFitWritable };
	},
});
</script>

<style lang="scss" scoped>
</style>
