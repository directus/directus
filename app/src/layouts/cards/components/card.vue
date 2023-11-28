<script setup lang="ts">
import { readableMimeType } from '@/utils/readable-mime-type';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

type File = {
	[key: string]: any;
	id: string;
	type: string;
	modified_on: Date;
};

const props = withDefaults(
	defineProps<{
		itemKey: string;
		icon?: string;
		file?: File;
		crop?: boolean;
		loading?: boolean;
		item?: Record<string, any>;
		modelValue?: (string | number)[];
		selectMode?: boolean;
		to?: string;
		readonly?: boolean;
	}>(),
	{
		icon: 'box',
		modelValue: () => [],
		to: '',
	},
);

const emit = defineEmits(['update:modelValue']);

const router = useRouter();

const imgError = ref(false);

const type = computed(() => {
	if (!props.file || !props.file.type) return null;
	if (!imgError.value && props.file.type.startsWith('image')) return null;
	return readableMimeType(props.file.type, true);
});

const imageInfo = computed(() => {
	let fileType = undefined;
	if (!props.file || !props.file.type) return null;
	if (props.file.type.startsWith('image') === true) fileType = 'image';
	if (props.file.type.includes('svg')) fileType = 'svg';

	// Show icon instead of thumbnail
	if (!fileType) return { source: undefined, fileType };

	let key = 'system-medium-cover';

	if (props.crop === false) {
		key = 'system-medium-contain';
	}

	const source = `/assets/${props.file.id}?key=${key}&modified=${props.file.modified_on}`;

	return { source, fileType };
});

const showThumbnail = computed(() => {
	return imageInfo.value && imageInfo.value.fileType;
});

const selectionIcon = computed(() => {
	if (!props.item) return 'radio_button_unchecked';

	return props.modelValue.includes(props.item[props.itemKey]) ? 'check_circle' : 'radio_button_unchecked';
});

function toggleSelection() {
	if (!props.item) return null;

	if (props.modelValue.includes(props.item[props.itemKey])) {
		emit(
			'update:modelValue',
			props.modelValue.filter((key) => key !== props.item?.[props.itemKey]),
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
</script>

<template>
	<div
		class="card"
		:class="{ loading, readonly, selected: item && modelValue.includes(item[itemKey]), 'select-mode': selectMode }"
		@click="handleClick"
	>
		<v-icon class="selector" :name="selectionIcon" @click.stop="toggleSelection" />
		<div class="header">
			<div class="selection-fade"></div>
			<v-skeleton-loader v-if="loading" />
			<template v-else>
				<v-icon-file v-if="type || imgError" :ext="type" />
				<template v-else>
					<v-image
						v-if="showThumbnail"
						:class="imageInfo?.fileType"
						:src="imageInfo?.source"
						:alt="item?.title"
						role="presentation"
					/>
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
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		overflow: hidden;
		background-color: var(--theme--background-normal);
		border-color: var(--theme--primary-subdued);
		border-style: solid;
		border-width: 0px;
		border-radius: var(--theme--border-radius);
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
			width: 75%;
			height: 75%;
			object-fit: contain;
		}

		.type {
			color: var(--theme--foreground-subdued);
			text-transform: uppercase;
		}

		.v-icon {
			--v-icon-color: var(--theme--foreground-subdued);
		}

		.v-skeleton-loader {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}

		.selection-fade {
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
				background-image: linear-gradient(-180deg, rgb(38 50 56 / 0.1) 10%, rgb(38 50 56 / 0));
				content: '';
			}
		}
	}

	&::before {
		position: absolute;
		top: 7px;
		left: 7px;
		z-index: 2;
		width: 18px;
		height: 18px;
		background-color: var(--theme--background);
		border-radius: 24px;
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
	}

	.selector {
		--v-icon-color: var(--white);
		--v-icon-color-hover: var(--white);

		position: absolute;
		top: 0px;
		left: 0px;
		z-index: 3;
		margin: 4px;
		opacity: 0;
		transition:
			opacity var(--fast) var(--transition),
			color var(--fast) var(--transition);

		&:hover {
			opacity: 1 !important;
		}
	}

	&.select-mode {
		.selector {
			opacity: 0.5;
		}

		.header {
			.selection-fade {
				opacity: 1;
			}
		}
	}

	&.selected {
		&::before {
			opacity: 1;
		}

		.selector {
			--v-icon-color: var(--theme--primary);
			--v-icon-color-hover: var(--theme--primary);

			opacity: 1;
		}

		.header {
			border-width: 12px;

			.selection-fade {
				opacity: 1;
			}
		}
	}

	&:hover {
		.selector {
			opacity: 0.5;
		}

		.header {
			.selection-fade {
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
	height: 26px;
	margin-top: 2px;
	overflow: hidden;
	line-height: 1.3em;
	white-space: nowrap;
	text-overflow: ellipsis;

	:deep(.render-template) {
		height: 100%;
	}
}

.subtitle {
	margin-top: 0px;
	color: var(--theme--foreground-subdued);
}
</style>
