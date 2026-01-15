import { JsonHelper } from '../helper.js';

export class JsonHelperSQLite extends JsonHelper {
	protected async checkSupport(): Promise<boolean> {
		// Check if the "json_extract" function is supported
		const res = await this.knex.select('name').from('pragma_function_list').where({ name: 'json_extract' });
		return res.length > 0;
	}
}
