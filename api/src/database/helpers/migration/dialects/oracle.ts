import { MigrationHelper } from '../types';

export class MigrationHelperOracle extends MigrationHelper {
	async changeToText(table: string, column: string, options: { nullable?: boolean } = {}): Promise<void> {
		await this.changeToTypeByCopy(table, column, options, (builder, column) => builder.text(column));
	}

	async changeToString(
		table: string,
		column: string,
		options: { nullable?: boolean; length?: number } = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, options, (builder, column, options) =>
			builder.string(column, options.length)
		);
	}
}
