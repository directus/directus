<template>
	<span
		class="v-icon"
		:class="[sizeClass, { 'has-click': hasClick, left, right }]"
		:role="hasClick ? 'button' : null"
		@click="emitClick"
	>
		<component v-if="customIconName" :is="customIconName" />
		<i v-else :style="{ fontSize: customSize }" :class="{ outline }">{{ name }}</i>
	</span>
</template>

<script lang="ts">
import { createComponent, reactive, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';
import CustomIconBox from './custom-icons/box.vue';
import useSizeClass, { sizeProps } from '@/compositions/size-class';

const customIcons: string[] = ['box'];

export default createComponent({
	components: { CustomIconBox },
	props: {
		name: {
			type: String,
			required: true
		},
		outline: {
			type: Boolean,
			default: false
		},
		sup: {
			type: Boolean,
			default: false
		},
		left: {
			type: Boolean,
			default: false
		},
		right: {
			type: Boolean,
			default: false
		},
		...sizeProps
	},

	setup(props, { emit, listeners }) {
		const sizeClass = computed<string | null>(() => {
			if (props.sup) return 'sup';
			return useSizeClass(props).value;
		});

		const customIconName = computed<string | null>(() => {
			if (customIcons.includes(props.name)) return `custom-icon-${props.name}`;
			return null;
		});

		const hasClick = computed<boolean>(() => listeners.hasOwnProperty('click'));

		return {
			sizeClass,
			customIconName,
			hasClick,
			emitClick
		};

		function emitClick(event: MouseEvent) {
			emit('click', event);
		}
	}
});
</script>

<style lang="scss" scoped>
.v-icon {
	--v-icon-color: currentColor;
	--v-icon-size: 24px;

	color: var(--v-icon-color);
	position: relative;
	display: inline-block;
	font-size: 0;
	width: var(--v-icon-size);
	height: var(--v-icon-size);
	vertical-align: middle;

	i {
		font-size: var(--v-icon-size);
		font-family: 'Material Icons';
		font-weight: normal;
		font-style: normal;
		display: inline-block;
		line-height: 1;
		text-transform: none;
		letter-spacing: normal;
		word-wrap: normal;
		white-space: nowrap;
		font-feature-settings: 'liga';
		vertical-align: middle;

		&.outline {
			font-family: 'Material Icons Outline';
		}
	}

	svg {
		position: relative;
		top: 2px;
		left: 2px;
		width: calc(100% - 4px); // the material icons all have a slight padding
		height: calc(100% - 4px);
		color: inherit;
		fill: currentColor;
	}

	&.has-click {
		cursor: pointer;
	}

	&.sup {
		--v-icon-size: 8px;
		vertical-align: 0px;

		i {
			vertical-align: 5px;
		}
	}

	&.x-small {
		--v-icon-size: 12px;
	}

	&.small {
		--v-icon-size: 18px;
	}

	&.large {
		--v-icon-size: 36px;
	}

	&.x-large {
		--v-icon-size: 48px;
	}

	&.left {
		margin-right: 8px;
		margin-left: -4px;
	}

	&.right {
		margin-left: 8px;
		margin-right: -4px;
	}
}
</style>
