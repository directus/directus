<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Choice } from './types';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { getAssetUrl } from '@/utils/get-asset-url';

interface CardPreviewProps {
	choice: Choice;
	isSelected: boolean;
	selectionType: 'radio' | 'checkbox';
	labelId: string;
	descriptionId?: string;
}

const props = defineProps<CardPreviewProps>();

const iconName = computed(() => {
	if (props.selectionType === 'checkbox') {
		return props.isSelected ? 'check_box' : 'check_box_outline_blank';
	}

	return props.isSelected ? 'radio_button_checked' : 'radio_button_unchecked';
});

const imageError = ref(false);

watch(
	() => props.choice.image,
	() => (imageError.value = false),
);
</script>

<template>
	<div class="preview" :class="{ selected: isSelected }">
		<div v-if="choice.icon_type === 'image' && choice.image && !imageError" class="image">
			<VImage
				:src="getAssetUrl(choice.image, { imageKey: 'system-medium-contain' })"
				:alt="choice.text"
				@error="imageError = true"
			/>
		</div>
		<span v-else class="fallback">
			<VIcon :name="choice.icon || 'box'" x-large />
		</span>

		<div class="check-indicator">
			<VIcon
				:name="iconName"
				:color="isSelected ? 'var(--theme--primary)' : 'var(--theme--form--field--input--border-color)'"
				class="icon"
				:class="{
					radio: selectionType === 'radio',
					checkbox: selectionType === 'checkbox',
				}"
			/>
		</div>
	</div>
	<VTextOverflow :id="labelId" :text="choice.text" class="name type-label" />
	<span v-if="choice.description" :id="descriptionId" class="description type-text">
		{{ choice.description }}
	</span>
</template>

<style scoped>
.preview {
	--preview-padding: 1rem;
	--preview-small-padding: 0.5rem;
	position: relative;
	inline-size: 100%;
	aspect-ratio: 16/10;
	margin-block-end: var(--preview-small-padding);
	background: var(--theme--form--field--input--background-subdued);
	border: var(--theme--border-width) solid var(--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: inset 0 0 0 0 var(--theme--primary);
	overflow: hidden;
	transition:
		border-color var(--fast) var(--transition),
		box-shadow var(--fast) var(--transition),
		background-color var(--fast) var(--transition);

	.fallback {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		inline-size: 100%;
		block-size: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--preview-padding);
		color: var(--theme--primary);
		font-size: 1.5rem;
		user-select: none;
		-webkit-user-drag: none;

		.v-icon {
			font-size: 3rem;
		}
	}

	img {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		inline-size: 100%;
		block-size: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		object-fit: contain;
		padding: var(--preview-small-padding);
		user-select: none;
		-webkit-user-drag: none;
	}
}

.preview.selected {
	border-color: var(--theme--primary);
	box-shadow: inset 0 0 0 var(--theme--border-width) var(--theme--primary);
}

.check-indicator {
	position: absolute;
	inset-block-start: var(--preview-small-padding);
	inset-inline-start: var(--preview-small-padding);
	z-index: 1;
	padding: 0;

	.icon {
		display: block;
		background: var(--theme--background);
		transition:
			color var(--fast) var(--transition),
			background-color var(--fast) var(--transition);

		&.radio {
			border-radius: 50%;
		}

		&.checkbox {
			border-radius: var(--theme--border-radius);
		}
	}
}

.name {
	color: var(--theme--form--field--input--foreground);
	text-align: start;
	padding: 0 0.25rem;
}

.description {
	color: var(--theme--form--field--input--foreground-subdued);
	margin-block-start: 0.25rem;
	text-align: start;
	padding: 0 0.25rem;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	line-clamp: 2;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
