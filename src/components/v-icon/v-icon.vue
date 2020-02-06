<template>
	<span
		class="v-icon"
		:class="[sizeClass, { 'has-click': hasClick }]"
		:style="{ color: colorStyle, width: customSize, height: customSize }"
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

const customIcons: string[] = ['box'];

export default createComponent({
	components: { CustomIconBox },
	props: {
		name: {
			type: String,
			required: true
		},
		color: {
			type: String,
			default: 'currentColor'
		},
		outline: {
			type: Boolean,
			default: false
		},
		sup: {
			type: Boolean,
			default: false
		},
		size: {
			type: Number,
			default: null
		},
		xSmall: {
			type: Boolean,
			default: false
		},
		small: {
			type: Boolean,
			default: false
		},
		large: {
			type: Boolean,
			default: false
		},
		xLarge: {
			type: Boolean,
			default: false
		}
	},

	setup(props, { emit, listeners }) {
		const sizeClass = computed<string | null>(() => {
			if (props.sup) return 'sup';
			if (props.xSmall) return 'x-small';
			if (props.small) return 'small';
			if (props.large) return 'large';
			if (props.xLarge) return 'x-large';
			return null;
		});

		const customSize = computed<string | null>(() => {
			if (props.size) return `${props.size}px`;
			return null;
		});

		const colorStyle = computed<string>(() => {
			return parseCSSVar(props.color);
		});

		const customIconName = computed<string | null>(() => {
			if (customIcons.includes(props.name)) return `custom-icon-${props.name}`;
			return null;
		});

		const hasClick = computed<boolean>(() => listeners.hasOwnProperty('click'));

		return {
			sizeClass,
			colorStyle,
			customIconName,
			customSize,
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
	position: relative;
	display: inline-block;
	font-size: 0;
	width: 24px;
	height: 24px;
	vertical-align: middle;

	&.sup {
		width: 8px;
		height: 8px;
		vertical-align: 0px;

		i {
			font-size: 8px;
			vertical-align: 5px;
		}
	}

	&.x-small {
		width: 12px;
		height: 12px;

		i {
			font-size: 12px;
		}
	}

	&.small {
		width: 18px;
		height: 18px;

		i {
			font-size: 18px;
		}
	}

	// Default is 24x24

	&.large {
		width: 36px;
		height: 36px;

		i {
			font-size: 36px;
		}
	}

	&.x-large {
		width: 48px;
		height: 48px;

		i {
			font-size: 48px;
		}
	}

	i {
		font-size: 24px;
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
}
</style>
