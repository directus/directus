<script setup lang="ts">
import { computed } from 'vue';
import { useSizeClass } from '@directus/composables';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { camelCase, upperFirst } from 'lodash';

import { components } from './custom-icons';

import SocialIcon from './social-icon.vue';
import { socialIcons } from './social-icons';

interface Props {
	/** Which type of icon to display */
	name: string;
	/** Removes the outline style if enabled */
	filled?: boolean;
	/** Makes the icon very small */
	sup?: boolean;
	/** Displays the icon more to the left */
	left?: boolean;
	/** Displays the icon more to the right */
	right?: boolean;
	/** Disables the icon */
	disabled?: boolean;
	/** If it should render inside a button */
	clickable?: boolean;
	/** What color for the icon to use */
	color?: string;
	/** Makes the icon smaller */
	xSmall?: boolean;
	/** Makes the icon small */
	small?: boolean;
	/** Makes the icon large */
	large?: boolean;
	/**	Makes the icon larger */
	xLarge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	filled: false,
	sup: false,
	left: false,
	right: false,
	disabled: false,
	clickable: false,
	color: undefined,
});

const emit = defineEmits(['click']);

const sizeClass = computed<string | null>(() => {
	if (props.sup) return 'sup';
	return useSizeClass(props).value;
});

const customIconName = computed(() => {
	const name = `CustomIcon${upperFirst(camelCase(props.name.replace(/_/g, '-')))}`;
	if (name in components) return components[name];
	return null;
});

const socialIconName = computed<IconName | null>(() => {
	if (socialIcons.includes(props.name)) return props.name.replace(/_/g, '-') as IconName;
	return null;
});

function emitClick(event: MouseEvent) {
	if (props.disabled) return;
	emit('click', event);
}
</script>

<template>
	<span
		class="v-icon"
		:class="[sizeClass, { 'has-click': !disabled && clickable, left, right }]"
		:role="clickable ? 'button' : undefined"
		:tabindex="clickable ? 0 : undefined"
		:style="{ '--v-icon-color': color }"
		@click="emitClick"
	>
		<component :is="customIconName" v-if="customIconName" />
		<SocialIcon v-else-if="socialIconName" :name="socialIconName" />
		<i v-else :class="{ filled }" :data-icon="name"></i>
	</span>
</template>

<style>
body {
	--v-icon-color: currentColor;
	--v-icon-color-hover: currentColor;
	--v-icon-size: 24px;
}
</style>

<style lang="scss" scoped>
.v-icon {
	position: relative;
	display: inline-block;
	width: var(--v-icon-size);
	min-width: var(--v-icon-size);
	height: var(--v-icon-size);
	color: var(--v-icon-color);
	font-size: 0;
	vertical-align: middle;

	i {
		display: block;
		font-family: 'Material Symbols';
		font-weight: normal;
		font-size: var(--v-icon-size);
		font-style: normal;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		white-space: nowrap;
		word-wrap: normal;
		direction: ltr;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
		font-feature-settings: 'liga';
		font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;

		&::after {
			content: attr(data-icon);
		}

		&.filled {
			font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
		}
	}

	svg {
		display: inline-block;
		color: inherit;
		fill: currentColor;

		&.svg-inline--fa {
			width: auto;
			height: auto;
		}
	}

	&.has-click {
		cursor: pointer;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--v-icon-color-hover);
		}
	}

	&.sup {
		--v-icon-size: 8px;

		vertical-align: 5px;
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

		&.small {
			margin-right: 4px;
		}
	}

	&.right {
		margin-left: 6px;

		&.small {
			margin-left: 4px;
		}
	}
}
</style>
