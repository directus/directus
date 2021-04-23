import { Toolbox } from '../../toolbox';
import { Help } from '../help';

export default (toolbox: Toolbox) => {
	toolbox.help = new Help({
		output: toolbox.output,
		runtime: toolbox.runtime,
		//events: toolbox.events,
		options: toolbox.options,
	});
};
