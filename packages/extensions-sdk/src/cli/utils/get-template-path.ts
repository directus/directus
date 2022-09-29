import path from 'path';

export default function getTemplatePath(): string {
	return path.resolve(__dirname, '..', '..', '..', '..', 'templates');
}
