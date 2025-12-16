<script setup lang="ts">
import VCollectionFieldTemplate from '@/components/v-collection-field-template.vue';
import VDetail from '@/components/v-detail.vue';
import VSelect from '@/components/v-select/v-select.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { useSync } from '@directus/composables';
import { Field } from '@directus/types';

const props = defineProps<{
	collection: string;
	icon: string;
	fileFields: Field[];
	imageFit: string;
	imageSource?: string | null;
	title?: string;
	subtitle?: string;
}>();

const emit = defineEmits<{
	(e: 'update:icon', icon: string): void;
	(e: 'update:imageSource', imageSource: string): void;
	(e: 'update:title', title: string): void;
	(e: 'update:subtitle', subtitle: string): void;
	(e: 'update:imageFit', imageFit: string): void;
}>();

const iconWritable = useSync(props, 'icon', emit);
const imageSourceWritable = useSync(props, 'imageSource', emit);
const titleWritable = useSync(props, 'title', emit);
const subtitleWritable = useSync(props, 'subtitle', emit);
const imageFitWritable = useSync(props, 'imageFit', emit);
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
});
</script>

<template>
	<div class="field">
		<div class="type-label">{{ $t('layouts.cards.image_source') }}</div>
		<v-select v-model="imageSourceWritable" show-deselect item-value="field" item-text="name" :items="fileFields" />
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.cards.title') }}</div>
		<v-collection-field-template v-model="titleWritable" :collection="collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.cards.subtitle') }}</div>
		<v-collection-field-template v-model="subtitleWritable" :collection="collection" />
	</div>

	<v-detail class="field">
		<template #title>{{ $t('advanced') }}</template>

		<div class="nested-options">
			<div class="field">
				<div class="type-label">{{ $t('layouts.cards.image_fit') }}</div>
				<v-select
					v-model="imageFitWritable"
					:disabled="imageSource === null"
					:items="[
						{
							text: $t('layouts.cards.crop'),
							value: 'crop',
						},
						{
							text: $t('layouts.cards.contain'),
							value: 'contain',
						},
					]"
				/>
			</div>

			<div class="field">
				<div class="type-label">{{ $t('fallback_icon') }}</div>
				<interface-select-icon :value="icon" @input="iconWritable = $event" />
			</div>
		</div>
	</v-detail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.nested-options {
	@include mixins.form-grid;
}
</style>
