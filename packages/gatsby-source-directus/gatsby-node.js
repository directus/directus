const invariant = require('invariant');
const { Directus } = require('@directus/sdk');
const { sourceNodes } = require('gatsby-source-graphql/gatsby-node');
const { createRemoteFileNode } = require('gatsby-source-filesystem');

const ms = require('ms');
const chalk = require('chalk');

let authToken;

/**
 * Normalizes Directus urls.
 */
function normalizeEndpoint(endpoint, query = {}) {
	const url = new URL(endpoint);
	if (!url.pathname.endsWith('/')) {
		url.pathname = `${url.pathname}/`;
	}

	Object.entries(query)
		.filter(([, value]) => value !== undefined)
		.forEach(([key, value]) => url.searchParams.set(key, value));

	try {
		const prefix = url.pathname == '/' ? '' : '.';

		const graphql = new URL(`${prefix}/graphql`, url.toString());
		graphql.hash = url.hash;
		graphql.search = url.search;

		const base = new URL(`${prefix}/`, url.toString());
		base.hash = url.hash;
		base.search = url.search;

		return {
			graphql: graphql.toString(),
			base: base.toString(),
		};
	} catch {
		return null;
	}
}

/**
 * Gatsby source implementation.
 */
exports.sourceNodes = async (gatsby, options) => {
	const { url, dev, graphql, auth, type = {}, ...opts } = options;
	invariant(url && url.length > 0, `\`gatsby-source-directus\` requires option \`url\` to be specified`);

	const hasAuth = !!auth;
	const hasToken = auth?.token && auth?.token?.length > 0;
	if (hasToken) {
		authToken = auth?.token;
	}
	const hasEmail = auth?.email && auth?.email?.length > 0;
	const hasPassword = auth?.password && auth?.password?.length > 0;
	const hasCredentials = hasEmail && hasPassword;

	if (hasAuth) {
		invariant(
			hasToken || (hasEmail && hasPassword),
			`\`gatsby-source-directus\` requires either an \`auth.token\` or a combination of \`auth.email\` and \`auth.password\``
		);

		if (!hasToken) {
			invariant(
				hasCredentials,
				`\`gatsby-source-directus\` requires both \`auth.email\` and \`auth.password\` when \`auth.token\` is not set`
			);
		}

		if (hasToken && hasCredentials) {
			// eslint-disable-next-line no-console
			console.log(
				chalk.yellowBright(
					'\nWARNING! `gatsby-source-directus` has both token and credentials set. Only token will be used.\n'
				)
			);
		}
	} else {
		// eslint-disable-next-line no-console
		console.log(
			chalk.yellowBright(
				'\nWARNING! `gatsby-source-directus` no auth set. source will fetch only public accessible items.\n'
			)
		);
	}

	let endpointParams = {};
	if (hasAuth && hasToken) {
		endpointParams.access_token = authToken;
	}

	let endpoints = normalizeEndpoint(url, endpointParams);
	invariant(endpoints !== null, `\`gatsby-source-directus\` requires a valid \`url\``);

	let refreshInterval = typeof dev?.refresh === 'string' ? ms(dev.refresh) / 1000 : dev?.refresh || 15;
	invariant(
		!Number.isNaN(refreshInterval),
		`\`gatsby-source-directus\` requires a valid \`dev.refresh\` to be specified.\n` +
			`can be either a number (seconds) or a string (5s, 1m, ...)`
	);

	const directus = new Directus(endpoints.base);

	let authResult;
	if (hasAuth && !hasToken) {
		try {
			authResult = await directus.auth.login({
				email: auth?.email,
				password: auth?.password,
			});
			authToken = authResult?.access_token;
		} catch (err) {
			throw new Error(`Directus authentication failed with: ${err.message}\nIs the credentials valid?`);
		}
	}

	const headers = async () => {
		let obj = {};
		if (typeof graphql?.headers === 'object') {
			Object.assign(obj, graphql?.headers || {});
		} else if (typeof graphql?.headers === 'function') {
			Object.assign(obj, (await graphql?.headers()) || {});
		}

		if (hasToken) {
			return Object.assign(obj, {
				Authorization: `Bearer ${auth?.token}`,
			});
		}

		if (authResult?.access_token) {
			return Object.assign(obj, {
				Authorization: `Bearer ${authResult?.access_token}`,
			});
		}
	};

	return await sourceNodes(gatsby, {
		...graphql,
		...opts,
		url: `${endpoints.graphql}`,
		typeName: type.name || 'DirectusData',
		fieldName: type.field || 'directus',
		moduleName: 'gatsby-source-directus',
		moduleSource: 'DirectusSource',
		refreshInterval,
		headers,
	});
};

/**
 * Gatsby file implementation.
 */
exports.createResolvers = async ({ actions, cache, createNodeId, createResolvers, store, reporter }, options) => {
	const { createNode } = actions;

	const { url } = options;

	let endpoints = normalizeEndpoint(url);

	await createResolvers({
		DirectusData_directus_files: {
			imageFile: {
				type: `File`,
				resolve(source) {
					if (!source || !source.id) {
						return null;
					}
					return createRemoteFileNode({
						url: `${endpoints.base}assets/${source.id}`,
						store,
						cache,
						createNode,
						createNodeId,
						httpHeaders: { Authorization: `Bearer ${authToken}` },
						reporter,
					});
				},
			},
		},
	});
};
