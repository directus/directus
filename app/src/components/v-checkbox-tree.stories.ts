import VCheckboxTree from './v-checkbox-tree/v-checkbox-tree.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VCheckboxTree',
	component: VCheckboxTree,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-checkbox-tree v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
	choices: [
		{
			text: 'Choice 1',
			value: 'choice-1',
			children: [
				{
					text: 'Choice 1.1',
					value: 'choice-1.1',
				},
				{
					text: 'Choice 1.2',
					value: 'choice-1.2',
				},
			],
		},
		{
			text: 'Choice 2',
			value: 'choice-2',
		},
		{
			text: 'Choice 3',
			value: 'choice-3',
		},
	],
	modelValue: ['choice-1.1', 'choice-3'],
};
