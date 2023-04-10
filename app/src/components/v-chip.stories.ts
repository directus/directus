import VChip from './v-chip.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VChip',
	component: VChip,
	argTypes: {
		close: { control: 'boolean' },
	},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-chip v-bind="args" v-on="args" >Cake</v-chip>',
});

export const Primary = Template.bind({});
Primary.args = {};
