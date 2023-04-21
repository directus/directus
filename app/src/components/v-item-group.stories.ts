import VItemGroup from './v-item-group.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VItemGroup',
	component: VItemGroup,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template:
		'<v-item-group v-bind="args" v-on="args" ><v-item watch value="item1" v-slot="{active}">First item is active: {{active}}</v-item><v-item value="item2" v-slot="{active}">Second item is active: {{active}}</v-item></v-item-group>',
});

export const Primary = Template.bind({});

Primary.args = {
	modelValue: ['item1'],
};
