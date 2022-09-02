import VFancySelect from './v-fancy-select.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VFancySelect',
	component: VFancySelect,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-fancy-select v-bind="args" v-on="args" >My Button</v-fancy-select>',
});

export const Primary = Template.bind({});
Primary.args = {
	items: [
		{
			icon: 'person',
			value: 'person',
			text: 'Person',
		},
		{
			icon: 'directions_car',
			value: 'car',
			text: 'Car',
		},
		{
			divider: true,
		},
		{
			icon: 'home',
			value: 'home',
			text: 'Home',
		},
	],
};
