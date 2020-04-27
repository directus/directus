<template>
	<div class="card" :class="{ loading }" @click="handleClick">
		<div class="header" :class="{ selected: value.includes(item) }">
			<div class="selection-indicator" :class="{ 'select-mode': selectMode }">
				<v-icon class="selector" :name="selectionIcon" @click.stop="toggleSelection" />
			</div>
			<v-skeleton-loader v-if="loading" />
			<template v-else>
				<p v-if="type" class="type type-title">{{ type }}</p>
				<template v-else>
					<img
						class="image"
						loading="lazy"
						v-if="imageSource"
						:src="imageSource"
						alt=""
						role="presentation"
					/>
					<img
						class="svg"
						v-else-if="svgSource"
						:src="svgSource"
						alt=""
						role="presentation"
					/>
					<v-icon v-else large :name="icon" />
				</template>
			</template>
		</div>
		<v-skeleton-loader v-if="loading" type="text" />
		<template v-else>
			<div class="title" v-if="$slots.title"><slot name="title" /></div>
			<div class="subtitle" v-if="$slots.subtitle"><slot name="subtitle" /></div>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import router from '@/router';

type File = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
	type: string;
	data: {
		full_url: string;
		thumbnails: {
			key: string;
			url: string;
		}[];
	};
};

export default defineComponent({
	props: {
		icon: {
			type: String,
			default: 'box',
		},
		file: {
			type: Object as PropType<File>,
			default: null,
		},
		crop: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		item: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
		value: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		to: {
			type: String,
			default: '',
		},
	},
	setup(props, { emit }) {
		const type = computed(() => {
			if (props.file === null) return null;
			if (props.file.type.startsWith('image')) return null;
			return props.file.type.split('/')[1];
		});

		const imageSource = computed(() => {
			if (props.file === null) return null;
			if (props.file.type.startsWith('image') === false) return null;
			if (props.file.type.includes('svg')) return null;

			let key = 'directus-medium-crop';

			if (props.crop === false) {
				key = 'directus-medium-contain';
			}

			const thumbnail = props.file.data.thumbnails.find((thumbnail) => thumbnail.key === key);

			if (!thumbnail) return null;

			return thumbnail.url;
		});

		const svgSource = computed(() => {
			if (props.file === null) return null;
			if (props.file.type.startsWith('image') === false) return null;
			if (props.file.type.includes('svg') === false) return null;

			return props.file.data.full_url;
		});

		const selectionIcon = computed(() =>
			props.value.includes(props.item) ? 'check_circle' : 'radio_button_unchecked'
		);

		return { imageSource, svgSource, type, selectionIcon, toggleSelection, handleClick };

		function toggleSelection() {
			if (props.value.includes(props.item)) {
				emit(
					'input',
					props.value.filter((item) => item !== props.item)
				);
			} else {
				emit('input', [...props.value, props.item]);
			}
		}

		function handleClick() {
			if (props.selectMode === true) {
				toggleSelection();
			} else {
				router.push(props.to);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.loading {
	.header {
		margin-bottom: 8px;
	}
}

.card {
	cursor: pointer;

	.header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		overflow: hidden;
		background-color: var(--background-normal);
		border-radius: var(--border-radius);

		&::after {
			display: block;
			padding-bottom: 100%;
			content: '';
		}

		.image {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			object-fit: contain;
		}

		.svg {
			width: 50%;
			height: 50%;
			object-fit: contain;
		}

		.type {
			color: var(--foreground-subdued);
			text-transform: uppercase;
		}

		.v-icon {
			--v-icon-color: var(--foreground-subdued);
		}

		.v-skeleton-loader {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}

		.selection-indicator {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 1;
			width: 100%;
			height: 48px;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);

			&.select-mode {
				opacity: 1;
			}

			.selector {
				--v-icon-color: var(--white);

				margin: 8px;
				opacity: 0.5;
				transition: opacity var(--fast) var(--transition);

				&:hover {
					opacity: 1;
				}
			}

			&::before {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background-image: linear-gradient(
					-180deg,
					rgba(38, 50, 56, 0.2) 10%,
					rgba(38, 50, 56, 0)
				);
				content: '';
			}
		}

		&.selected {
			.selection-indicator {
				.selector {
					opacity: 1;
				}
			}
		}
	}

	&:hover {
		.header {
			.selection-indicator {
				opacity: 1;
			}
		}
	}
}

.title,
.subtitle {
	width: 100%;
	overflow: hidden;
	line-height: 1.3em;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.title {
	margin-top: 4px;
}

.subtitle {
	color: var(--foreground-subdued);
}
</style>
