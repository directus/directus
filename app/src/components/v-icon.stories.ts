import VIcon from './v-icon/v-icon.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VIcon',
	component: VIcon,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-icon v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
	name: 'delete',
};
