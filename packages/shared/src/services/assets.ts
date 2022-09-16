import { Knex } from 'knex';
import { Accountability, TransformationParams, TransformationPreset } from '../types';
import { AuthorizationService } from './authorization';
export declare interface AssetsService {
	knex: Knex;
	accountability: Accountability | null;
	authorizationService: AuthorizationService;
	getAsset(
		id: string,
		transformation: TransformationParams | TransformationPreset,
		range?: any // should be Range from '@directus/drive';
	): Promise<{
		stream: NodeJS.ReadableStream;
		file: any;
		stat: any; // should be StatResponse from '@directus/drive';
	}>;
}
