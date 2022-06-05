import path from 'path';
import { AppExtension, AppExtensionType, Extension } from '../../types';

export function generateExtensionsEntry(type: AppExtensionType, extensions: Extension[], isApp = false): string {
	const filteredExtensions = extensions.filter((extension): extension is AppExtension => extension.type === type);

	return `${filteredExtensions
		.reduce((agg: any[], extension: any, i) => {
			if (extension.entrypoint.api) {
				if (!isApp) {
					agg.push(
						`import eapi${i} from './${path
							.relative('.', path.resolve(extension.path, extension.entrypoint.api))
							.split(path.sep)
							.join(path.posix.sep)}';\n`
					);
				} else {
					agg.push(
						`import eapp${i} from './${path
							.relative('.', path.resolve(extension.path, extension.entrypoint.app))
							.split(path.sep)
							.join(path.posix.sep)}';\n`
					);
				}
			} else {
				agg.push(
					`import e${i} from './${path
						.relative('.', path.resolve(extension.path, extension.entrypoint))
						.split(path.sep)
						.join(path.posix.sep)}';\n`
				);
			}

			return agg;
		}, [])
		.join('')}export default [${filteredExtensions
		.reduce((agg: any[], extension: any, i) => {
			if (extension.entrypoint.api) {
				if (!isApp) {
					agg.push(`eapi${i}`);
				} else {
					agg.push(`eapp${i}`);
				}
			} else {
				agg.push(`e${i}`);
			}

			return agg;
		}, [])
		.join(',')}];`;
}
