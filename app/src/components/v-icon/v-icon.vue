<template>
	<span
		class="v-icon"
		:class="[sizeClass, { 'has-click': !disabled && hasClick, left, right }]"
		:role="hasClick ? 'button' : null"
		@click="emitClick"
		:tabindex="hasClick ? 0 : null"
	>
		<component v-if="customIconName" :is="customIconName" />
		<i v-else :class="{ filled }">{{ name }}</i>
	</span>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useSizeClass, { sizeProps } from '@/composables/size-class';

import CustomIconDirectus from './custom-icons/directus.vue';
import CustomIconBookmarkSave from './custom-icons/bookmark_save.vue';
import CustomIconBox from './custom-icons/box.vue';
import CustomIconCommitNode from './custom-icons/commit_node.vue';
import CustomIconGrid1 from './custom-icons/grid_1.vue';
import CustomIconGrid2 from './custom-icons/grid_2.vue';
import CustomIconGrid3 from './custom-icons/grid_3.vue';
import CustomIconGrid4 from './custom-icons/grid_4.vue';
import CustomIconGrid5 from './custom-icons/grid_5.vue';
import CustomIconGrid6 from './custom-icons/grid_6.vue';
import CustomIconSignalWifi1Bar from './custom-icons/signal_wifi_1_bar.vue';
import CustomIconSignalWifi2Bar from './custom-icons/signal_wifi_2_bar.vue';
import CustomIconSignalWifi3Bar from './custom-icons/signal_wifi_3_bar.vue';
import CustomIconFlipHorizontal from './custom-icons/flip_horizontal.vue';
import CustomIconFlipVertical from './custom-icons/flip_vertical.vue';
import CustomIconFolderMove from './custom-icons/folder_move.vue';
import CustomIconLogout from './custom-icons/logout.vue';

const customIcons: string[] = [
	'directus',
	'bookmark_save',
	'box',
	'commit_node',
	'grid_1',
	'grid_2',
	'grid_3',
	'grid_4',
	'grid_5',
	'grid_6',
	'signal_wifi_1_bar',
	'signal_wifi_2_bar',
	'signal_wifi_3_bar',
	'flip_horizontal',
	'flip_vertical',
	'folder_move',
	'logout',
];

export default defineComponent({
	components: {
		CustomIconDirectus,
		CustomIconBookmarkSave,
		CustomIconBox,
		CustomIconCommitNode,
		CustomIconGrid1,
		CustomIconGrid2,
		CustomIconGrid3,
		CustomIconGrid4,
		CustomIconGrid5,
		CustomIconGrid6,
		CustomIconSignalWifi1Bar,
		CustomIconSignalWifi2Bar,
		CustomIconSignalWifi3Bar,
		CustomIconFlipHorizontal,
		CustomIconFlipVertical,
		CustomIconFolderMove,
		CustomIconLogout,
	},
	props: {
		name: {
			type: String,
			required: true,
		},
		filled: {
			type: Boolean,
			default: false,
		},
		sup: {
			type: Boolean,
			default: false,
		},
		left: {
			type: Boolean,
			default: false,
		},
		right: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		...sizeProps,
	},

	setup(props, { emit, listeners }) {
		const sizeClass = computed<string | null>(() => {
			if (props.sup) return 'sup';
			return useSizeClass(props).value;
		});

		const customIconName = computed<string | null>(() => {
			if (customIcons.includes(props.name)) return `custom-icon-${props.name}`.replace(/_/g, '-');
			return null;
		});

		const hasClick = computed<boolean>(() => listeners.hasOwnProperty('click'));

		return {
			sizeClass,
			customIconName,
			hasClick,
			emitClick,
		};

		function emitClick(event: MouseEvent) {
			if (props.disabled) return;
			emit('click', event);
		}
	},
});
</script>

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
		font-weight: normal;
		font-size: var(--v-icon-size);
		/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
		font-family: 'Material Icons Outline';
		font-style: normal;
		line-height: 1;
		letter-spacing: normal;
		white-space: nowrap;
		text-transform: none;
		word-wrap: normal;
		font-feature-settings: 'liga';

		&.filled {
			/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
			font-family: 'Material Icons';
		}
	}

	svg {
		display: inline-block;
		color: inherit;
		fill: currentColor;
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
		margin-left: -4px;

		&.small {
			margin-right: 4px;
			margin-left: -2px;
		}
	}

	&.right {
		margin-right: -6px;
		margin-left: 6px;

		&.small {
			margin-right: 4px;
			margin-left: -2px;
		}
	}
}
</style>
