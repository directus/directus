import { Toolbox } from '../../toolbox';
import { Options } from '../options';

export default (toolbox: Toolbox) => {
	toolbox.options = new Options(toolbox.events, [...process.argv].splice(2));
};
