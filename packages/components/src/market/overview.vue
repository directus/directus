<template>
	<div class="overview">
		<template v-if="type !== 'installed'">
			<v-skeleton-loader v-if="loading || !currentCarousel" class="carousel" type="block-list-item" />
			<div v-else class="carousel" :style="currentCarousel?.styles">
				<transition name="carousel">
					<div
						:key="currentCarousel.extension.id"
						class="carousel-extension"
						@click="push((app ? '/settings/market/extensions/' : '/extensions/') + currentCarousel.extension.id)"
					>
						<div v-if="currentCarousel.extension.latest_version.types" class="types">
							{{
								currentCarousel.extension.latest_version.types
									.map((type: any) => type.extension_types_type.name)
									.join(', ')
							}}
						</div>
						<div class="title">{{ formatTitle(currentCarousel.extension.id) }}</div>
						<div v-if="currentCarousel.extension.author?.name" class="author">
							By {{ currentCarousel.extension.author.name }}
						</div>
						<div class="spacer"></div>
						<div class="description">{{ currentCarousel.extension.description }}</div>
						<img class="image" :src="currentCarousel.image" />
					</div>
				</transition>
				<div class="dots">
					<div
						v-for="i in carousel.length"
						:key="i"
						class="dot"
						:class="{ active: i === carouselIndex + 1 }"
						@click="setCarouselIndex(i - 1)"
					/>
				</div>
			</div>
			<div class="featured-title">Featured</div>
			<div class="featured">
				<template v-if="loading">
					<v-skeleton-loader v-for="i in 4" :key="i" type="text" />
				</template>
				<template v-else>
					<div
						v-for="extension in featured"
						:key="extension['extension'].id"
						class="featured-extension"
						@click="push((app ? '/settings/market/extensions/' : '/extensions/') + extension['extension'].id)"
					>
						<img :src="extension['image']" />
						<div class="title">{{ formatTitle(extension['extension'].id) }}</div>
						<div class="description">{{ extension['extension'].description }}</div>
					</div>
				</template>
			</div>
		</template>
		<div class="extensions-title">
			<div>Extensions</div>
			<v-select v-model="sort" :items="sortOptions" inline />
		</div>
		<ExtensionList :type="type" :query="query" :app="app" :existing-extensions="existingExtensions" grid />
	</div>
</template>

<script setup lang="ts">
import type { AxiosInstance } from 'axios';
import { formatTitle } from '@directus/utils/browser';
import { useRouter } from 'vue-router';
import { inject, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import ExtensionList from './extension-list.vue';
import type { ExtensionInfo } from '@directus/types';

interface Props {
	search?: string | null;
	app?: boolean;
	existingExtensions?: ExtensionInfo[];
	type: string;
}

interface Carousel {
	extension: {
		id: string;
		latest_version: {
			types: {
				extension_types_type: {
					name: string;
				};
			}[];
		};
		author: {
			name: string;
		};
		description: string;
	};
	image: string;
	color: string;
	styles: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
	search: '',
	app: false,
});

const sort = ref('-downloads_last_month');

const query = computed(() => {
	return {
		search: props.search ?? '',
		sort: sort.value,
	};
});

const sortOptions = [
	{ text: 'Recently Updated', value: '-updated' },
	{ text: 'Most Popular', value: '-downloads_last_month' },
];

const { push } = useRouter();

const api = inject('api') as AxiosInstance;

const featured = ref<Record<string, any>[]>([]);
const carousel = ref<Carousel[]>([]);
const carouselIndex = ref(0);

const currentCarousel = computed<Carousel | undefined>(() => {
	const current = carousel.value[carouselIndex.value]!;
	const lightColor = hexToHSL(current.color);

	return {
		...current,
		styles: {
			'--extension-color': current.color,
			'--extension-color-light': `hsl(${lightColor.h * 360}, ${lightColor.s * 100}%, ${Math.max(
				0,
				lightColor.l * 100 - 25
			)}%)`,
		},
	};
});

function hexToHSL(hex: string) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	if (!result) return { h: 0, s: 0, l: 0 };

	const r = parseInt(result[1]!, 16) / 255,
		g = parseInt(result[2]!, 16) / 255,
		b = parseInt(result[3]!, 16) / 255;

	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);

	let h: number, s: number;
	const l: number = (max + min) / 2;

	if (max == min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			default:
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	return { h, s, l };
}

let interval: any;
const intervalLength = 10000;

onMounted(() => {
	loadFeatured();

	clearInterval(interval);

	interval = setInterval(() => {
		carouselIndex.value = (carouselIndex.value + 1) % carousel.value.length;
	}, intervalLength);
});

onBeforeUnmount(() => {
	clearInterval(interval);
});

function setCarouselIndex(index: number) {
	carouselIndex.value = index;

	clearInterval(interval);

	setTimeout(() => {
		clearInterval(interval);

		interval = setInterval(() => {
			carouselIndex.value = (carouselIndex.value + 1) % carousel.value.length;
		}, intervalLength);
	}, intervalLength);
}

const loading = ref(true);

async function loadFeatured() {
	loading.value = true;

	const response = await api.get('/items/featured', {
		params: {
			fields:
				'date,carousel,image.filename_disk,color,extension.id,extension.icon,extension.description,extension.author.name,extension.latest_version.types.extension_types_type.name',
			sort: 'sort',
		},
	});

	const data = response.data.data.map((extension: Record<string, any>) => {
		extension['image'] = api.defaults.baseURL + 'assets/' + extension['image'].filename_disk;
		return extension;
	});

	featured.value = data.filter((ext: Record<string, any>) => ext['carousel'] === false);
	carousel.value = data.filter((ext: Record<string, any>) => ext['carousel'] === true);
	loading.value = false;
}
</script>

<style lang="scss" scoped>
.overview {
	max-width: min(856px, 100%);
	overflow: hidden;
}

.carousel {
	margin-top: 60px;
	position: relative;
	height: 240px;
	border-radius: 12px;
	transition: background-color var(--slow) var(--transition);

	&:not(.v-skeleton-loader) {
		background-color: var(--extension-color);
	}

	.carousel-extension {
		position: relative;
		height: 100%;
		padding: 20px;
		padding-right: 50%;

		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		cursor: pointer;

		&.carousel-enter-active {
			transition: all 500ms ease-in-out;
		}

		&.carousel-leave-active {
			transition: all 500ms ease-in-out;
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 100%;
		}

		&.carousel-enter-from {
			transform: translateX(800px);
			opacity: 0;
		}

		&.carousel-leave-to {
			transform: translateX(-800px);
			opacity: 0;
		}

		.types {
			color: var(--extension-color-light);
			transition: color 1ms 500ms var(--transition);
		}

		.title {
			font-size: 24px;
			font-weight: 700;
			margin: 4px 0;
		}

		.author {
			font-size: 14px;
			color: var(--foreground-inverted);
		}

		.spacer {
			flex-grow: 1;
		}

		.description {
			color: var(--foreground-inverted);
		}

		.image {
			position: absolute;
			top: 50%;
			right: 40px;
			transform: translate(0%, -55%);
			max-width: 50%;

			@media (max-width: 800px) {
				right: 20px;
			}
		}
	}

	.dots {
		position: absolute;
		bottom: 12px;
		right: 16px;
		display: flex;

		.dot {
			cursor: pointer;
			padding: 8px 4px;

			&::after {
				content: '';
				display: block;
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background-color: var(--background-page);
				opacity: 0.25;
				transition: opacity var(--fast) var(--transition);
			}

			&.active::after {
				opacity: 1;
			}
		}
	}
}

.featured {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 4px;
	width: 100%;

	.v-skeleton-loader {
		height: 120px;
	}
}

.featured-extension {
	display: flex;
	flex-direction: column;
	cursor: pointer;
	padding: 8px;
	border-radius: var(--border-radius);

	&:hover {
		background-color: var(--background-subdued);
	}

	img {
		max-width: 100%;
	}

	.title {
		margin: 8px 0 4px 0px;
	}

	.description {
		font-size: 12px;
		line-height: 1.5;
		color: var(--foreground-subdued);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}
}

.extensions-title,
.featured-title {
	margin-top: 48px;
	margin-bottom: 16px;
	font-size: 16px;
	font-weight: 600;
}

.extensions-title {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.v-select {
		font-weight: 500;
		font-size: 14px;
	}
}
</style>
