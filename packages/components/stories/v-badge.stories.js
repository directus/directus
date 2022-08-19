import VBadge from '../src/components/v-badge.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
  title: 'Example/VBadge',
  component: VBadge,
  argTypes: {
    
  },
};

const Template = (args, { argTypes }) => ({
  setup() {
    return { args: fix(args, argTypes) };
  },
  template: '<v-badge v-bind="args" v-on="args" ><v-icon name="notifications_active" /></v-badge>',
});

export const Primary = Template.bind({});
Primary.args = {
    value: '+9'
};