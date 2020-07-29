import Vue from 'vue';
import markdown from './readme.md';
import VIcon from '../v-icon/';
import VHover from './v-hover.vue';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-hover', VHover);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Hover',
	component: VHover,
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () => `
<v-hover v-slot="{ hover }" tag="span">
	<v-icon :style="{ '--v-icon-color': hover ? 'var(--red)' : 'var(--blue)' }" name="person" x-large />
</v-hover>
`;

export const customMarkup = () => `
<v-hover v-slot="{ hover }" tag="span">
	<template v-if="hover">
		<v-icon name="star" color="--amber" />
		Hovering! 🎉🥳
	</template>
	<template v-else>
		Hover me.
	</template>
</v-hover>
`;
