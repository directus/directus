import validate from 'validate-npm-package-name';

export const validateName = (extension: string) => {
	const { validForNewPackages: valid, errors } = validate(extension);

	if (valid === false && errors) {
		throw new TypeError(`Extension name is not a valid npm package name: ${errors.join(', ')}`);
	}
};
