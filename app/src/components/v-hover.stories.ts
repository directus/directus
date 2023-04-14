import VHover from './v-hover.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VHover',
	component: VHover,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template:
		'<v-hover v-bind="args" v-on="args" v-slot="{ hover }">Hover me!<div v-if="hover">This is only shown on hover.</div></v-hover>',
});

export const Primary = Template.bind({});

Primary.args = {};
