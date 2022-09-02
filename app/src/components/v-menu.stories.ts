import VMenu from './v-menu.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VMenu',
	component: VMenu,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: `
<v-menu v-bind="args" v-on="args" >
    <template #activator="{ toggle }">
        <v-icon clickable class="options" name="more_vert" @click="toggle" />
    </template>
    <v-list>
        <v-list-item clickable>
            <v-list-item-icon><v-icon name="folder_open" /></v-list-item-icon>
            <v-list-item-content>
                Choose from Library
            </v-list-item-content>
        </v-list-item>

        <v-list-item clickable>
            <v-list-item-icon><v-icon name="link" /></v-list-item-icon>
            <v-list-item-content>
                Choose from Url
            </v-list-item-content>
        </v-list-item>
    </v-list>
</v-menu>`,
});

export const Primary = Template.bind({});
Primary.args = {};
