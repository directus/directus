import registerComponent from '@/utils/register-component/';
import interfaces from './index';

// inter, cause interface is a reserved keyword in JS... :C
interfaces.forEach((inter) => {
	registerComponent('interface-' + inter.id, inter.component);
});
