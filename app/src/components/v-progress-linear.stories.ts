import VProgressLinear from './v-progress-linear.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VProgressLinear',
	component: VProgressLinear,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-progress-linear v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});

Primary.args = {
	value: 70,
	colorful: true,
};
