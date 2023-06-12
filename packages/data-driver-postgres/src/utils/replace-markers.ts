/**
 * Replace all `?` markers in a string with Postgres parameter markers (`$1`, `$2`, ...`$n`)
 * @param sql - Any SQL string that contains markers that should be replaced
 * @returns The final SQL query with appropriate parameters
 */
export const replaceMarkers = (sql: string) => {
	let count = 0;
	return sql.replace(/\?/g, () => `$${++count}`).trimEnd();
};
