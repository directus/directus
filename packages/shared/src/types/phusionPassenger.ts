import { EventEmitter } from 'events';

export interface PhusionPassenger extends EventEmitter {
	options: {
		passenger_version: string;
		start_command: string;
		startup_file: string;
	};
}
