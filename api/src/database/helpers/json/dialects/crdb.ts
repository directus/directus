import { JsonHelper } from '../helper.js';

export class JsonHelperCockroachdb extends JsonHelper {
	protected async checkSupport(): Promise<boolean> {
		// Check if the "jsonb_extract_path" function is supported
		// But CockroachDB has supported JSONB natively since v1.0 so we may just be able to "return true" here
		const res = await this.knex
			.select('function')
			.from('crdb_internal.builtin_functions')
			.where({ function: 'jsonb_extract_path' });

		return res.length > 0;
	}
}
