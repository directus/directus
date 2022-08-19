import VWorkspaceTile from '../src/components/v-workspace-tile.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VWorkspaceTile',
    component: VWorkspaceTile,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-workspace-tile v-bind="args" v-on="args" >Contents of the tile</v-workspace-tile>',
});

export const Primary = Template.bind({});
Primary.args = {
    name: 'My Tile'
};