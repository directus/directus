// dynamically adds fields to the sql strings as the schema grows
export const sqlFieldFormatter = (schema: Record<string, any>, table: string) => {
	const fields = [];

	// Exclude alias fields, unable to selected in DB
	for (const field of Object.keys(schema['collections'][table].fields)) {
		if (schema['collections'][table].fields[field].type !== 'alias') {
			fields.push(field);
		}
	}

	let sql = '';

	for (const field of fields.slice(0, fields.length - 1)) {
		sql += `"${table}"."${field}", `;
	}

	sql += `"${table}"."${fields[fields.length - 1]}"`;
	return sql;
};

export const sqlFieldList = (schema: Record<string, any>, table: string) => {
	const fields = [];

	// Exclude alias fields, unable to selected in DB
	for (const field of Object.keys(schema['collections'][table].fields)) {
		if (schema['collections'][table].fields[field].type !== 'alias') {
			fields.push(field);
		}
	}

	let sql = '';

	for (const field of fields.slice(0, fields.length - 1)) {
		sql += `"${field}", `;
	}

	sql += `"${fields[fields.length - 1]}"`;
	return sql;
};
