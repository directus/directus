import registerComponent from '@/utils/register-component/';
import interfaces from './index';

interfaces.forEach((inter) => {
	registerComponent('interface-' + inter.id, inter.component);

	if (typeof inter.options === 'function') {
		registerComponent(`interface-options-${inter.id}`, inter.options);
	}
});
