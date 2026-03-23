import type { Ora } from 'ora';
import type { Report } from '../../types.js';
import checkBuiltCode from './check-built-code.js';
import checkDirectusConfig from './check-directus-config.js';
import checkLicense from './check-license.js';
import checkReadme from './check-readme.js';

interface Validator {
	name: string;
	handler: (spinner: Ora, reports: Array<Report>) => Promise<string>;
}

const validators: Validator[] = [checkReadme, checkLicense, checkDirectusConfig, checkBuiltCode];

export default validators;
