import { h, Component } from 'vue';
import { RouterView } from 'vue-router';

export default function routerPassthrough(): Component {
	const component = () => h(RouterView);

	component.displayName = 'router-passthrough';

	return component;
}
