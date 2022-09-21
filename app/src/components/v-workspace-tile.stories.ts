import VWorkspaceTile from './v-workspace-tile.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VWorkspaceTile',
	component: VWorkspaceTile,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-workspace-tile v-bind="args" v-on="args" >Contents of the tile</v-workspace-tile>',
});

export const Primary = Template.bind({});
Primary.args = {
	name: 'My Tile',
};
