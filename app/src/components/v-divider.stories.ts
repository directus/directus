import VDivider from './v-divider.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VDivider',
	component: VDivider,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-divider v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {};
