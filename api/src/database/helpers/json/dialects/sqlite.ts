import { JsonHelper } from '../types.js';

export class JsonHelperSQLite extends JsonHelper {
	override async supported() {
		// Check if the "json_extract" function is supported
		const res = await this.knex.select('name').from('pragma_function_list').where({ name: 'json_extract' });
		return res.length > 0;
	}
}
