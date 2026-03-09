import { registerCommands } from '../composables/use-command-registry';
import { contentCommands } from './content';
import { copyApiUrlCommands } from './copy-api-url';
import { dataModelCommands } from './data-model';
import { collectionItemFlowCommands, flowCommands } from './flows';
import { searchCommands } from './search';
import { settingsCommands } from './settings';
import { usersCommands } from './users';

export function registerBuiltInCommands() {
	registerCommands(
		contentCommands,
		searchCommands,
		settingsCommands,
		dataModelCommands,
		usersCommands,
		flowCommands,
		collectionItemFlowCommands,
		copyApiUrlCommands,
	);
}
