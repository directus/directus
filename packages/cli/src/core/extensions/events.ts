import { Toolbox } from '../../toolbox';
import { Events } from '../events';

export default (toolbox: Toolbox): void => {
	toolbox.events = new Events();
};
