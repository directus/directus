import { ServiceUnavailableError } from '@directus/errors';
import type { Bus } from '@directus/memory';
import { useBus } from '../../bus/index.js';
import { getLogsController, LogsController } from '../controllers/index.js';
import { fmtMessage } from '../utils/message.js';

export class LogsHandler {
	controller: LogsController;
	messenger: Bus;

	constructor(controller?: LogsController) {
		controller = controller ?? getLogsController();

		if (!controller) {
			throw new ServiceUnavailableError({ service: 'ws', reason: 'WebSocket server is not initialized' });
		}

		this.controller = controller;
		this.messenger = useBus();

		this.messenger.subscribe('logs', (message: Record<string, any>) => {
			// broadcast streaming log
			const logMsg = fmtMessage('logs', { data: message });
			this.controller.clients.forEach((client) => client.send(logMsg));
		});
	}
}
