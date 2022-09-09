import { EventEmitter } from 'events';

interface PhusionPassenger extends EventEmitter {
	options: {
		passenger_version: string;
		start_command: string;
		startup_file: string;
	};
}

declare global {
	const PhusionPassenger: PhusionPassenger | undefined;
}
