import VList from './v-list.vue';

document.body.classList.add('light');

export default {
	title: 'Components/List/VList',
	component: VList,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: `
<v-list v-bind="args" v-on="args" >
    <v-list-item>Item 1 </v-list-item>
    <v-list-item>Item 2 </v-list-item>
    <v-list-item>Item 3 </v-list-item>
</v-list>
    `,
});

export const Primary = Template.bind({});

Primary.args = {
	modelValue: [1],
};
