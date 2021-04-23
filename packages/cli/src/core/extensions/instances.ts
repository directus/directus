import { Directus } from '@directus/sdk';
import { Toolbox } from '../../toolbox';

export default (toolbox: Toolbox) => {
	toolbox.instance = new Directus('http://url');
};
