import { PhusionPassenger } from '../../types';

declare const PhusionPassenger: PhusionPassenger | undefined;

export function getEntryFile(): string | undefined {
	return PhusionPassenger !== undefined ? PhusionPassenger.options.startup_file : require.main?.filename;
}
