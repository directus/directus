import VCheckbox from './v-checkbox.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VCheckbox',
	component: VCheckbox,
	argTypes: {
		modelValue: { action: 'updateModelValue' },
	},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-checkbox v-bind="args" v-on="args">My Checkbox</v-checkbox>',
});

export const Primary = Template.bind({});
Primary.args = {
	modelValue: true,
};
