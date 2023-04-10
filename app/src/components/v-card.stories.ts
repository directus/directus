import VCard from './v-card.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VCard',
	component: VCard,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: `<v-card v-bind="args" v-on="args" >
    <v-card-title>Want a cake?</v-card-title>
    <v-card-text>
        If you want a cake, you have to click on accept.
        And the cake is definitely not a lie.
    </v-card-text>
    <v-card-actions>
        <v-button secondary>Decline</v-button>
        <v-button>Accept</v-button>
    </v-card-actions>
</v-card>`,
});

export const Primary = Template.bind({});
Primary.args = {};
