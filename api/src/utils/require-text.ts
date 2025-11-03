import fse from 'fs-extra';

export function requireText(filepath: string): string {
	return fse.readFileSync(filepath, 'utf8');
}
