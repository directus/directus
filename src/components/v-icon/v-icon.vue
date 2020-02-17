<template>
	<span
		class="v-icon"
		:class="[sizeClass, { 'has-click': hasClick, left, right }]"
		:role="hasClick ? 'button' : null"
		@click="emitClick"
	>
		<component v-if="customIconName" :is="customIconName" />
		<i v-else :class="{ outline }">{{ name }}</i>
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

	position: relative;
	display: inline-block;
	width: var(--v-icon-size);
	height: var(--v-icon-size);
	color: var(--v-icon-color);
	font-size: 0;
	vertical-align: middle;

	i {
		display: inline-block;
		font-weight: normal;
		font-size: var(--v-icon-size);
		/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
		font-family: 'Material Icons';
		font-style: normal;
		line-height: 1;
		letter-spacing: normal;
		white-space: nowrap;
		text-transform: none;
		vertical-align: middle;
		word-wrap: normal;
		font-feature-settings: 'liga';

		&.outline {
			/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
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

		vertical-align: 0;

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
		margin-right: -4px;
		margin-left: 8px;
	}
}
</style>
