import type { DataModel } from "./types.js";

/**
 * Fetch the data-model definitions from the API
 */
export async function fetchDataModel(url: string, api_key: string): Promise<DataModel> {
	const fetchData = (path: string) => fetch(new URL(path, url), { headers: { 'Authorization': 'Bearer ' + api_key }})
		.then(response => response.json())
		.then(({ data }) => data);

	const [collections, fields, relations] = await Promise.all([
		fetchData('/collections'),
		fetchData('/fields'),
		fetchData('/relations'),
	]);

	return { collections, fields, relations };
}
