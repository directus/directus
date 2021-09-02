<template>
	<div
		class="card"
		:class="{ loading, readonly, selected: item && modelValue.includes(item[itemKey]) }"
		@click="handleClick"
	>
		<v-icon class="selector" :name="selectionIcon" @click.stop="toggleSelection" />
		<div class="header">
			<div class="selection-indicator" :class="{ 'select-mode': selectMode }"></div>
			<v-skeleton-loader v-if="loading" />
			<template v-else>
				<p v-if="type || imgError" class="type type-title">{{ type }}</p>
				<template v-else>
					<img
						v-if="imageSource"
						class="image"
						loading="lazy"
						:src="imageSource"
						alt=""
						role="presentation"
						@error="imgError = true"
					/>
					<img v-else-if="svgSource" class="svg" :src="svgSource" alt="" role="presentation" @error="imgError = true" />
					<v-icon v-else large :name="icon" />
				</template>
			</template>
		</div>
		<v-skeleton-loader v-if="loading" type="text" />
		<template v-else>
			<div v-if="$slots.title" class="title"><slot name="title" /></div>
			<div v-if="$slots.subtitle" class="subtitle"><slot name="subtitle" /></div>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getRootPath } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';
import { readableMimeType } from '@/utils/readable-mime-type';

type File = {
	[key: string]: any;
	id: string;
	type: string;
	modified_on: Date;
};

export default defineComponent({
	emits: ['update:modelValue'],
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
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
		modelValue: {
			type: Array as PropType<(string | number)[]>,
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
		readonly: {
			type: Boolean,
			default: false,
		},
		itemKey: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const router = useRouter();

		const imgError = ref(false);

		const type = computed(() => {
			if (!props.file || !props.file.type) return null;
			if (!imgError.value && props.file.type.startsWith('image')) return null;
			return readableMimeType(props.file.type, true);
		});

		const imageSource = computed(() => {
			if (!props.file || !props.file.type) return null;
			if (props.file.type.startsWith('image') === false) return null;
			if (props.file.type.includes('svg')) return null;

			let key = 'system-medium-cover';

			if (props.crop === false) {
				key = 'system-medium-contain';
			}

			const url = getRootPath() + `assets/${props.file.id}?key=${key}&modified=${props.file.modified_on}`;
			return addTokenToURL(url);
		});

		const svgSource = computed(() => {
			if (!props.file || !props.file.type) return null;
			if (props.file.type.startsWith('image') === false) return null;
			if (props.file.type.includes('svg') === false) return null;

			const url = getRootPath() + `assets/${props.file.id}?modified=${props.file.modified_on}`;
			return addTokenToURL(url);
		});

		const selectionIcon = computed(() => {
			if (!props.item) return 'radio_button_unchecked';

			return props.modelValue.includes(props.item[props.itemKey]) ? 'check_circle' : 'radio_button_unchecked';
		});

		return { imageSource, svgSource, type, selectionIcon, toggleSelection, handleClick, imgError };

		function toggleSelection() {
			if (!props.item) return null;

			if (props.modelValue.includes(props.item[props.itemKey])) {
				emit(
					'update:modelValue',
					props.modelValue.filter((key) => key !== props.item[props.itemKey])
				);
			} else {
				emit('update:modelValue', [...props.modelValue, props.item[props.itemKey]]);
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
	position: relative;
	cursor: pointer;

	.header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		overflow: hidden;
		z-index: 1;
		background-color: var(--background-normal);
		border-radius: var(--border-radius);
		border-width: 0px;
		border-style: solid;
		border-color: var(--primary-50);
		transition: border-width var(--fast) var(--transition);

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
			position: absolute;
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

			&::before {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background-image: linear-gradient(-180deg, rgba(38, 50, 56, 0.1) 10%, rgba(38, 50, 56, 0));
				content: '';
			}

			&.select-mode {
				opacity: 1;
			}
		}
	}

	&::before {
		position: absolute;
		top: 7px;
		left: 7px;
		width: 18px;
		height: 18px;
		background-color: var(--white);
		content: '';
		z-index: 2;
		border-radius: 24px;
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	.selector {
		--v-icon-color: var(--white);
		--v-icon-color-hover: var(--white);

		position: absolute;
		top: 0px;
		left: 0px;
		margin: 4px;
		opacity: 0.5;
		z-index: 3;
		transition: opacity var(--fast) var(--transition), color var(--fast) var(--transition);

		&:hover {
			opacity: 1;
		}
	}

	&.selected {
		&::before {
			opacity: 1;
		}
		.selector {
			opacity: 1;
			--v-icon-color: var(--primary);
			--v-icon-color-hover: var(--primary);
		}
		.header {
			border-width: 12px;
		}
	}

	&:hover {
		.selector {
			opacity: 1;
		}
		.header {
			.selection-indicator {
				opacity: 1;
			}
		}
	}
}

.readonly {
	pointer-events: none;
}

.title,
.subtitle {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 20px;
	margin-top: 2px;
	overflow: hidden;
	line-height: 1.3em;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.subtitle {
	color: var(--foreground-subdued);
	margin-top: 0px;
}
</style>
