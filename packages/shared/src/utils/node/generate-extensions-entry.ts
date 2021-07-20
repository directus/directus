import path from 'path';
import { AppExtensionType, Extension } from '../../types';

export function generateExtensionsEntry(type: AppExtensionType, extensions: Extension[]): string {
	const filteredExtensions = extensions.filter((extension) => extension.type === type);

	return `${filteredExtensions
		.map(
			(extension, i) =>
				`import e${i} from './${path
					.relative('.', path.resolve(extension.path, extension.entrypoint || ''))
					.split(path.sep)
					.join(path.posix.sep)}';\n`
		)
		.join('')}export default [${filteredExtensions.map((_, i) => `e${i}`).join(',')}];`;
}
