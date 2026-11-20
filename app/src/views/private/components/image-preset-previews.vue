<script setup lang="ts">
import type { SettingsStorageAssetPreset } from '@directus/types';
import { getFocalPointCrop } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type Crop = NonNullable<ReturnType<typeof getFocalPointCrop>>;

export type ImageTransform = { rotate: number; scaleX: number; scaleY: number };

const THUMBNAIL_MAX_WIDTH = 96;
const THUMBNAIL_MAX_HEIGHT = 52;

const thumbnailStyle = { inlineSize: `${THUMBNAIL_MAX_WIDTH}px`, blockSize: `${THUMBNAIL_MAX_HEIGHT}px` };
const labelStyle = { maxInlineSize: `${THUMBNAIL_MAX_WIDTH}px` };

const props = defineProps<{
	src: string;
	/** Size of the image the presets crop, after `imageTransform` is applied to `src` */
	width: number;
	height: number;
	focalPoint: { x: number; y: number } | null;
	presets: SettingsStorageAssetPreset[];
	imageTransform?: ImageTransform;
}>();

const { t } = useI18n();

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
		.map((group) => {
			const names = group.keys.filter((key): key is string => !!key);

			return {
				...group,
				...getThumbnailStyles(group.crop),
				name: names[0] ?? null,
				// Every other preset that crops the same way, listed in the tooltip
				tooltip: group.keys.length > 1 ? names.join(', ') : null,
				ariaLabel: `${group.ratio}, ${t('preset_count', group.keys.length)}: ${names.join(', ')}`,
			};
		});
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

	const { rotate, scaleX, scaleY } = props.imageTransform ?? { rotate: 0, scaleX: 1, scaleY: 1 };
	const quarterTurn = rotate % 180 !== 0;
	const sourceWidth = quarterTurn ? props.height : props.width;
	const sourceHeight = quarterTurn ? props.width : props.height;

	// Centre the source on the transformed image so rotating around its own centre lines the two up
	const offsetX = ((props.width - sourceWidth) / 2 - crop.left) * scale;
	const offsetY = ((props.height - sourceHeight) / 2 - crop.top) * scale;

	return {
		frameStyle: { inlineSize: `${frameWidth}px`, blockSize: `${frameHeight}px` },
		imageStyle: {
			inlineSize: `${sourceWidth * scale}px`,
			blockSize: `${sourceHeight * scale}px`,
			// Same order as Cropper and its cropped canvas: rotate, then flip
			transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`,
		},
	};
}

function greatestCommonDivisor(a: number, b: number): number {
	return b ? greatestCommonDivisor(b, a % b) : a;
}
</script>

<template>
	<section class="image-preset-previews" :aria-label="$t('preset_previews')">
		<ul class="groups">
			<li
				v-for="group in groups"
				:key="group.ratio"
				v-tooltip="group.tooltip"
				class="group"
				:aria-label="group.ariaLabel"
			>
				<span class="thumbnail" :style="thumbnailStyle">
					<span class="frame" :style="group.frameStyle">
						<img :src :style="group.imageStyle" alt="" />
					</span>
				</span>

				<span class="label" :style="labelStyle" aria-hidden="true">
					<span class="name">
						<span class="key">{{ group.name ?? group.ratio }}</span>
						<span v-if="group.keys.length > 1" class="more">+{{ group.keys.length - 1 }}</span>
					</span>
					<span v-if="group.name" class="ratio">{{ group.ratio }}</span>
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

.groups {
	display: flex;
	gap: 0.5rem;
	flex-grow: 1;
	min-inline-size: 0;
	margin: 0;
	padding: 0 0 0.25rem;
	overflow-x: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--theme--border-color-accent) transparent;
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

		/* Draw the raw pixels, as Cropper does, so the EXIF turn comes only from the transform */
		image-orientation: none;
	}
}

.label {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	line-height: 1;
}

.name {
	display: flex;
	gap: 0.25rem;
	max-inline-size: 100%;
}

.key {
	font-weight: 600;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.more {
	flex-shrink: 0;
}

.more,
.ratio {
	color: var(--theme--foreground-subdued);
	font-feature-settings: 'tnum';
}
</style>
