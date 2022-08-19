import VAvatar from '../src/components/v-avatar.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
  title: 'Example/VAvatar',
  component: VAvatar,
  argTypes: {
    
  },
};

const Template = (args, { argTypes }) => ({
  setup() {
    return { args: fix(args, argTypes) };
  },
  template: '<v-avatar v-bind="args" v-on="args" ><v-icon name="person" /></v-avatar>',
});

export const Primary = Template.bind({});
Primary.args = {
};