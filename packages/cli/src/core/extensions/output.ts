import { Output } from '../output';
import { Toolbox } from '../../toolbox';
import { JsonOutputFormat } from '../output/formats/json';
import { YamlOutputFormat } from '../output/formats/yaml';

export default (toolbox: Toolbox): void => {
	toolbox.output = new Output(toolbox.options);
	toolbox.events.on('output.formats.register', (output) => {
		output.registerFormat('json', new JsonOutputFormat());
		output.registerFormat('yaml', new YamlOutputFormat());
		output.registerFormat('yml', new YamlOutputFormat());
	});
};
