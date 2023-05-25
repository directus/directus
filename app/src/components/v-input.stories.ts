import VInput from './v-input.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VInput',
	component: VInput,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-input v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});

Primary.args = {
	modelValue: 'Shut up and take my money. 💸',
	disabled: false,
};
