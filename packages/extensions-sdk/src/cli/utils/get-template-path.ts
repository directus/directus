import { resolve } from 'node:path';

export default function getTemplatePath(): string {
	return resolve(import.meta.dirname, '..', '..', '..', 'templates');
}
