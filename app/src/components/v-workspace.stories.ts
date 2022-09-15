import VWorkspace from './v-workspace.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VWorkspace',
	component: VWorkspace,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-workspace v-bind="args" v-on="args" ></v-workspace>',
});

export const Primary = Template.bind({});
Primary.args = {
	tiles: [
		{
			id: '1',
			x: 1,
			y: 1,
			width: 10,
			height: 10,
			name: 'My Tile 1',
		},
		{
			id: '2',
			x: 15,
			y: 5,
			width: 10,
			height: 10,
			name: 'My Tile 2',
		},
	],
};
