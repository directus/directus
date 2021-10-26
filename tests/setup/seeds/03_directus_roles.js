exports.seed = function (knex) {
	return knex('directus_roles').insert([
		{ id: '5b935e65-d3db-4457-96f1-597e2fcfc7f3', name: 'TestAdmin', admin_access: true, app_access: true },
	]);
};
