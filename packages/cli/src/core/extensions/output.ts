import { Output } from '../output';
import { Toolbox } from '../../toolbox';
import { JsonOutputFormat } from '../output/formats/json';

export default (toolbox: Toolbox) => {
	toolbox.output = new Output(toolbox.options);
	toolbox.events.on('output.formats.register', (output) => {
		output.registerFormat('json', new JsonOutputFormat());
	});
};
