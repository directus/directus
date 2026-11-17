<script setup lang="ts">
import type { SettingsStorageAssetPreset } from '@directus/types';
import { getFocalPointCrop } from '@directus/utils';
import { computed } from 'vue';
import VNotice from '@/components/v-notice.vue';

type Crop = NonNullable<ReturnType<typeof getFocalPointCrop>>;

const THUMBNAIL_MAX_WIDTH = 96;
const THUMBNAIL_MAX_HEIGHT = 52;

const thumbnailStyle = { inlineSize: `${THUMBNAIL_MAX_WIDTH}px`, blockSize: `${THUMBNAIL_MAX_HEIGHT}px` };

const props = defineProps<{
	src: string;
	width: number;
	height: number;
	focalPoint: { x: number; y: number } | null;
	presets: SettingsStorageAssetPreset[];
	hasImageEdits?: boolean;
}>();

const groups = computed(() => {
	const original = { w: props.width, h: props.height };

	const byRatio = new Map<string, { ratio: string; crop: Crop; keys: (string | null)[] }>();

	for (const preset of props.presets) {
		const crop = getFocalPointCrop(original, props.focalPoint, preset);
		if (!crop) continue;

		// Group by the dimensions the API actually resizes to
		const width = preset.withoutEnlargement ? Math.min(preset.width!, props.width) : preset.width!;
		const height = preset.withoutEnlargement ? Math.min(preset.height!, props.height) : preset.height!;
		const divisor = greatestCommonDivisor(width, height);
		const ratio = `${width / divisor}:${height / divisor}`;

		if (!byRatio.has(ratio)) byRatio.set(ratio, { ratio, crop, keys: [] });
		byRatio.get(ratio)!.keys.push(preset.key);
	}

	return [...byRatio.values()]
		.sort((a, b) => b.crop.width / b.crop.height - a.crop.width / a.crop.height)
		.map((group) => ({ ...group, ...getThumbnailStyles(group.crop) }));
});

function getThumbnailStyles(crop: Crop) {
	const ratio = crop.width / crop.height;
	let frameWidth = THUMBNAIL_MAX_HEIGHT * ratio;
	let frameHeight = THUMBNAIL_MAX_HEIGHT;

	if (frameWidth > THUMBNAIL_MAX_WIDTH) {
		frameWidth = THUMBNAIL_MAX_WIDTH;
		frameHeight = THUMBNAIL_MAX_WIDTH / ratio;
	}

	const scale = frameWidth / crop.width;

	return {
		frameStyle: { inlineSize: `${frameWidth}px`, blockSize: `${frameHeight}px` },
		imageStyle: {
			inlineSize: `${props.width * scale}px`,
			blockSize: `${props.height * scale}px`,
			transform: `translate(${-crop.left * scale}px, ${-crop.top * scale}px)`,
		},
	};
}

function greatestCommonDivisor(a: number, b: number): number {
	return b ? greatestCommonDivisor(b, a % b) : a;
}
</script>

<template>
	<section class="image-preset-previews" :aria-label="$t('preset_previews')">
		<VNotice v-if="hasImageEdits" type="warning" class="notice">{{ $t('preset_previews_image_edits') }}</VNotice>

		<p v-else-if="groups.length === 0" class="empty">{{ $t('preset_previews_empty') }}</p>

		<ul v-else class="groups">
			<li
				v-for="group in groups"
				:key="group.ratio"
				class="group"
				:aria-label="`${group.ratio}, ${$t('preset_count', group.keys.length)}`"
				:title="group.keys.join(', ')"
			>
				<span class="thumbnail" :style="thumbnailStyle">
					<span class="frame" :style="group.frameStyle">
						<img :src :style="group.imageStyle" alt="" />
					</span>
				</span>

				<span class="label" aria-hidden="true">
					<span class="ratio">{{ group.ratio }}</span>
					<span class="count">×{{ group.keys.length }}</span>
				</span>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.image-preset-previews {
	display: flex;
	flex-shrink: 0;
	padding: 0.75rem 1.25rem;
	background-color: var(--theme--background);
	border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.empty,
.notice {
	flex-grow: 1;
}

.empty {
	color: var(--theme--foreground-subdued);
}

.groups {
	display: flex;
	gap: 0.5rem;
	flex-grow: 1;
	min-inline-size: 0;
	margin: 0;
	padding: 0;
	overflow-x: auto;
	list-style: none;
}

.group {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.375rem;
	padding: 0.375rem 0.5rem;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
}

.thumbnail {
	display: flex;
	align-items: center;
	justify-content: center;
}

.frame {
	/* Crops are in image pixels, so position them left to right in every locale */
	direction: ltr;
	position: relative;
	overflow: hidden;
	border-radius: 2px;

	img {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		max-inline-size: none;
		transform-origin: top left;
	}
}

.label {
	display: flex;
	gap: 0.375rem;
	font-size: 0.75rem;
	line-height: 1;
}

.ratio {
	font-weight: 600;
	font-feature-settings: 'tnum';
}

.count {
	color: var(--theme--foreground-subdued);
	font-feature-settings: 'tnum';
}
</style>
