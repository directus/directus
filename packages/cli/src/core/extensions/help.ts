import { GluegunToolbox } from 'gluegun';
import { Toolbox } from '../../toolbox';
import { Help } from '../help';

export default (toolbox: Toolbox): void => {
	const tb = (toolbox as any) as GluegunToolbox;
	toolbox.help = new Help(tb.runtime?.brand ?? 'directus', {
		output: toolbox.output,
		runtime: toolbox.runtime,
		//events: toolbox.events,
		options: toolbox.options,
	});
};
