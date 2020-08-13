import { Component } from 'vue';
import registerComponent from '@/utils/register-component/';
import displays from './index';

displays.forEach((display) => {
	if (typeof display.handler !== 'function') {
		registerComponent('display-' + display.id, display.handler as Component);
	}

	if (typeof display.options !== 'function') {
		registerComponent('display-options-' + display.id, display.options as Component);
	}
});
