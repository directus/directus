import VWorkspace from '../src/components/v-workspace.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VWorkspace',
    component: VWorkspace,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
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
        }, {
            id: '2',
            x: 15,
            y: 5,
            width: 10,
            height: 10,
            name: 'My Tile 2',
        }
    ]
};