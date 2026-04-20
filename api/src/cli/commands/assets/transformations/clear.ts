import { useLogger } from '../../../../logger/index.js';
import { AssetsService } from '../../../../services/assets.js';
import { getSchema } from '../../../../utils/get-schema.js';

export default async function transformationsClear({ files }: { files?: string[] }): Promise<void> {
	const logger = useLogger();

	try {
		const schema = await getSchema();

		const service = new AssetsService({
			schema,
		});

		await service.clearTransformations({ files });

		process.stdout.write('Cleared asset transformations successfully\n');
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
