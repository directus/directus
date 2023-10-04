import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';

export const flowName = 'Schedule Hook Test';
export const logPrefix = 'flow-executed-on-';
export const envTargetVariable = 'FLOWS_SCHEDULE_HOOK_NAME';

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
				name: 'Log to Console',
				key: 'log_to_console',
				type: 'log',
				options: { message: `${logPrefix}{{ $env.${envTargetVariable} }}` },
			};

			const flowId = (
				await request(getUrl(vendor))
					.post('/flows')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.query({ fields: ['id'] })
					.send(payloadFlowCreate)
			).body.data.id;

			await request(getUrl(vendor))
				.patch(`/flows/${flowId}`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
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
