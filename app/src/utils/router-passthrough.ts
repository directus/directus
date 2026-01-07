import { Component, h } from 'vue';
import { RouterView } from 'vue-router';

const component: Component = () => h(RouterView);

component.displayName = 'router-passthrough';

export default component;
