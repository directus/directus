export default function getSdkVersion(): string {
	const pkg = require('../../../../package.json');

	return pkg.version;
}
