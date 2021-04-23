import { Toolbox } from '../../toolbox';
import { Events } from '../events';

export default (toolbox: Toolbox) => {
	toolbox.events = new Events();
};
