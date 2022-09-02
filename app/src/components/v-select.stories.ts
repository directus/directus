import VSelect from './v-select/v-select.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VSelect',
	component: VSelect,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: `<v-select v-bind="args" v-on="args"></v-select>`,
});

export const Primary = Template.bind({});
Primary.args = {
	items: [
		{
			text: 'Item 1',
			value: 'item1',
		},
		{
			text: 'Item 2',
			value: 'item2',
		},
		{
			text: 'Item 3',
			value: 'item3',
		},
	],
	modelValue: 'item2',
};
