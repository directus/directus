import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import { CreateCollection, CreateField, DeleteCollection } from '@common/index';
import request from 'supertest';

export const collection = 'test_flows_schedule_hook';
export const fieldData = 'field_data';
export const flowName = 'Schedule Hook Test';
export const envTargetVariable = 'FLOWS_SCHEDULE_HOOK_NAME';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				await DeleteCollection(vendor, { collection });

				await CreateCollection(vendor, {
					collection,
				});

				await CreateField(vendor, {
					collection,
					field: fieldData,
					type: 'string',
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000
	);
};

export const seedDBValues = async () => {
	let isSeeded = true;

	await Promise.all(
		vendors.map(async (vendor) => {
			const payloadFlowCreate = {
				name: flowName,
				icon: 'bolt',
				color: null,
				description: null,
				status: 'inactive',
				accountability: null,
				trigger: 'schedule',
				options: { cron: '*/2 * * * * *' },
			};

			const payloadOperationCreate = {
				position_x: 19,
				position_y: 1,
				name: 'Create Record',
				key: 'op_create',
				type: 'item-create',
				options: {
					payload: { [fieldData]: `{{ $env.${envTargetVariable} }}` },
					collection,
					permissions: '$full',
				},
			};

			const flowId = (
				await request(getUrl(vendor))
					.post('/flows')
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.query({ fields: ['id'] })
					.send(payloadFlowCreate)
			).body.data.id;

			await request(getUrl(vendor))
				.patch(`/flows/${flowId}`)
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
				.send({ operation: { ...payloadOperationCreate, flow: flowId } });
		})
	)
		.then(() => {
			isSeeded = true;
		})
		.catch(() => {
			isSeeded = false;
		});

	return isSeeded;
};
