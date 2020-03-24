import registerComponent from '@/utils/register-component/';
import interfaces from './index';

// inter, cause interface is reserved keyword in JS... o_o
interfaces.forEach((inter) => {
	registerComponent('interface-' + inter.id, inter.component);

	if (inter.display && typeof inter.display === 'object') {
		registerComponent('display-' + inter.id, inter.display);
	}
});
