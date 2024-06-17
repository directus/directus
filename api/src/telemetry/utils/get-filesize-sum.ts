import { type Knex } from 'knex';

export interface FilesizeSum {
	total: number;
}

export const getFilesizeSum = async (db: Knex): Promise<FilesizeSum> => {
	const query = <{ total?: number | string } | undefined>(
		await db.sum({ total: 'filesize' }).from('directus_files').first()
	);

	return {
		total: query?.total ? Number(query.total) : 0,
	};
};
