<script setup lang="ts">
import { useSizeClass } from '@directus/composables';
import { isIn } from '@directus/utils';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { camelCase, upperFirst } from 'lodash';
import { computed } from 'vue';
import { RTL_REVERSE_ICONS } from '../../constants/text-direction';
import { components } from './custom-icons';
import SocialIcon from './social-icon.vue';
import { socialIcons } from './social-icons';
import { useUserStore } from '@/stores/user';

const props = withDefaults(
	defineProps<{
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
	}>(),
	{
		filled: false,
		sup: false,
		left: false,
		right: false,
		disabled: false,
		clickable: false,
		color: undefined,
	},
);

const emit = defineEmits(['click']);

const userStore = useUserStore();

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

const mirrored = computed(() => userStore.textDirection === 'rtl' && isIn(props.name, RTL_REVERSE_ICONS));

function emitClick(event: MouseEvent) {
	if (props.disabled) return;
	emit('click', event);
}
</script>

<template>
	<component
		:is="clickable ? 'button' : 'span'"
		:type="clickable ? 'button' : undefined"
		class="v-icon"
		:class="[sizeClass, { 'has-click': !disabled && clickable, left, right, mirrored }]"
		:disabled="clickable ? disabled : undefined"
		:style="{ '--v-icon-color': color }"
		@click="emitClick"
	>
		<component :is="customIconName" v-if="customIconName" class="custom-icon-svg" />
		<SocialIcon v-else-if="socialIconName" :name="socialIconName" />
		<i v-else :class="{ filled }" :data-icon="name"></i>
	</component>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-icon-color        [currentColor]
		--v-icon-color-hover  [currentColor]
		--v-icon-size         [1.25rem]

*/

.v-icon {
	position: relative;
	display: inline-block;
	inline-size: var(--v-icon-size, 1.25rem);
	min-inline-size: var(--v-icon-size, 1.25rem);
	block-size: var(--v-icon-size, 1.25rem);
	color: var(--v-icon-color, currentColor);
	font-size: 0;
	vertical-align: middle;

	i {
		display: block;
		font-family: 'Material Symbols';
		font-weight: normal;
		font-size: var(--v-icon-size, 1.25rem);
		font-style: normal;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		white-space: nowrap;
		overflow-wrap: normal;
		direction: ltr;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
		font-feature-settings: 'liga';
		font-variation-settings:
			'FILL' 0,
			'wght' 400,
			'GRAD' 0,
			'opsz' 24;

		&::after {
			content: attr(data-icon);
		}

		&.filled {
			font-variation-settings:
				'FILL' 1,
				'wght' 400,
				'GRAD' 0,
				'opsz' 24;
		}
	}

	svg {
		display: inline-block;
		color: inherit;
		fill: currentColor;

		&.svg-inline--fa {
			inline-size: 100%;
			block-size: 100%;
		}
	}

	&.has-click {
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--v-icon-color-hover, currentColor);
		}
	}

	&[disabled] {
		cursor: not-allowed;
	}

	&.sup {
		--v-icon-size: 0.4375rem;

		vertical-align: 0.3125rem;
	}

	&.x-small {
		--v-icon-size: 0.6875rem;
	}

	&.small {
		--v-icon-size: 1rem;
	}

	&.large {
		--v-icon-size: 2rem;
	}

	&.x-large {
		--v-icon-size: 2.6875rem;
	}

	&.left {
		margin-inline-end: 0.4375rem;

		&.small {
			margin-inline-end: 0.25rem;
		}
	}

	&.right {
		margin-inline-start: 0.3125rem;

		&.small {
			margin-inline-start: 0.25rem;
		}
	}

	&.mirrored {
		transform: scaleX(-1);
	}
}

.custom-icon-svg {
	inline-size: 100%;
	block-size: 100%;
}
</style>
