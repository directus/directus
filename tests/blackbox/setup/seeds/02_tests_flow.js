import { generateHash } from '../setup-utils.js';

export async function seed(knex) {
	await knex('tests_flow_data').del();
	await knex('tests_flow_completed').del();

	await knex('directus_roles').where('id', 'd70c0943-5b55-4c5d-a613-f539a27a57f5').del();

	await knex('directus_roles').insert([
		{
			id: 'd70c0943-5b55-4c5d-a613-f539a27a57f5',
			name: 'Tests Flow Role',
		},
	]);

	await knex('directus_policies').where('id', '9cd8b17c-474b-4abb-b366-09dcdb45e177').del();

	await knex('directus_policies').insert([
		{
			id: '9cd8b17c-474b-4abb-b366-09dcdb45e177',
			name: 'Tests Flow Policy',
			admin_access: true,
			app_access: true,
		},
	]);

	await knex('directus_access').where('id', '27029bb1-8b2e-43c2-b966-eb049f84ea68').del();

	await knex('directus_access').insert([
		{
			id: '27029bb1-8b2e-43c2-b966-eb049f84ea68',
			role: 'd70c0943-5b55-4c5d-a613-f539a27a57f5',
			policy: '9cd8b17c-474b-4abb-b366-09dcdb45e177',
		},
	]);

	await knex('directus_revisions').whereIn('version', knex('directus_versions').select('id').where('user_created', '3d075128-c073-4f5d-891c-ed2eb2790a1c')).del();
	await knex('directus_versions').where('user_created', '3d075128-c073-4f5d-891c-ed2eb2790a1c').del();
	await knex('directus_users').where('id', '3d075128-c073-4f5d-891c-ed2eb2790a1c').del();

	await knex('directus_users').insert([
		{
			id: '3d075128-c073-4f5d-891c-ed2eb2790a1c',
			email: 'flow@tests.com',
			password: await generateHash('TestsFlowUserPassword'),
			status: 'active',
			role: 'd70c0943-5b55-4c5d-a613-f539a27a57f5',
			token: 'TestsFlowToken',
		},
	]);
}
