import { useLogger } from '../../../logger/index.js';
import { UtilsService } from '../../../services/utils.js';
import { getSchema } from '../../../utils/get-schema.js';

export default async function assetsClear({ file }: { file?: string[] }): Promise<void> {
	const logger = useLogger();

	try {
		const schema = await getSchema();

		const service = new UtilsService({
			accountability: null,
			schema,
		});

		await service.clearAssetVariants({ file });

		process.stdout.write('Cleared asset variants successfully\n');
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
