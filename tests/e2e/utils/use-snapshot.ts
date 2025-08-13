import { DirectusClient, RestClient, schemaApply, schemaDiff } from '@directus/sdk';
import { readFile } from 'fs/promises';

export async function useSnapshot(api: DirectusClient<any> & RestClient<any>, file: string) {
	const snapshot = await readFile(file, { encoding: 'utf8' });
	const diff = await api.request(schemaDiff(JSON.parse(snapshot), true));

	if (diff) {
		diff.diff['collections'] = diff.diff['collections'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
		diff.diff['fields'] = diff.diff['fields'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
		diff.diff['relations'] = diff.diff['relations'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
	}

	if (diff) await api.request(schemaApply(diff));
}
