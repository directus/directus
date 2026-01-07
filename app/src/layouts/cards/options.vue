<script setup lang="ts">
import { useSync } from '@directus/composables';
import { Field } from '@directus/types';
import { defineComponent } from 'vue';
import VCollectionFieldTemplate from '@/components/v-collection-field-template.vue';
import VDetail from '@/components/v-detail.vue';
import VSelect from '@/components/v-select/v-select.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';

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
export default defineComponent({
	inheritAttrs: false,
});
</script>

<template>
	<div class="field">
		<div class="type-label">{{ $t('layouts.cards.image_source') }}</div>
		<VSelect v-model="imageSourceWritable" show-deselect item-value="field" item-text="name" :items="fileFields" />
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.cards.title') }}</div>
		<VCollectionFieldTemplate v-model="titleWritable" :collection="collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ $t('layouts.cards.subtitle') }}</div>
		<VCollectionFieldTemplate v-model="subtitleWritable" :collection="collection" />
	</div>

	<VDetail class="field">
		<template #title>{{ $t('advanced') }}</template>

		<div class="nested-options">
			<div class="field">
				<div class="type-label">{{ $t('layouts.cards.image_fit') }}</div>
				<VSelect
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
				<InterfaceSelectIcon :value="icon" @input="iconWritable = $event" />
			</div>
		</div>
	</VDetail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.nested-options {
	@include mixins.form-grid;
}
</style>
