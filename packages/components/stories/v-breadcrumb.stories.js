import VBreadcrumb from '../src/components/v-breadcrumb.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
  title: 'Example/VBreadcrumb',
  component: VBreadcrumb,
  argTypes: {
    
  },
};

const Template = (args, { argTypes }) => ({
  setup() {
    return { args: fix(args, argTypes) };
  },
  template: '<v-breadcrumb v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    items: [
        {
            to: '/',
            name: 'Home'
        }, {
            to: '/settings',
            name: 'settings',
            icon: 'settings'
        }, {
            to: '/settings/profile',
            name: 'Profile',
            icon: 'person',
            disabled: true
        }
    ]
};