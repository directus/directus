import { registerComponent } from '@/utils';
import interfaces from './index';

// inter, cause interface is a reserved keyword in JS... :C
interfaces.forEach((inter) => {
	registerComponent('interface-' + inter.id, inter.component);
});
