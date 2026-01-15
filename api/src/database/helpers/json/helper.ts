import { DatabaseHelper } from '../types.js';

export abstract class JsonHelper extends DatabaseHelper {
	protected isSupported: boolean | null = null;
	protected abstract checkSupport(): Promise<boolean>;
	async supported(): Promise<boolean> {
		if (this.isSupported === null) {
			this.isSupported = await this.checkSupport();
		}

		return this.isSupported;
	}

	parseJsonFunction(functionString: string): { field: string; path: string } {
		if (!functionString.startsWith('json(') || !functionString.endsWith(')')) {
			throw new Error('Invalid json() syntax');
		}

		// Extract content between parentheses
		const content = functionString.substring('json('.length, functionString.length - 1).trim();

		if (!content) {
			throw new Error('Invalid json() syntax');
		}

		// Split on first dot to separate field from path
		const firstDotIndex = content.indexOf('.');

		if (firstDotIndex === -1 || firstDotIndex === 0) {
			throw new Error('Invalid json() syntax');
		}

		return {
			field: content.substring(0, firstDotIndex),
			path: content.substring(firstDotIndex), // Keeps the leading dot
		};
	}
}
