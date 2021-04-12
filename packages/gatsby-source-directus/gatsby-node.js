const invariant = require('invariant');
const Directus = require('@directus/sdk-js');
const { sourceNodes } = require('@lnfusion/gatsby-source-graphql');
const { createRemoteFileNode } = require("gatsby-source-filesystem");

const ms = require('ms');
const chalk = require('chalk');

/**
 * Stores authentication data in memory
 */
class MemoryStore {
	constructor() {
		this.values = {};
	}

	async getItem(key) {
		return this.values[key];
	}

	async setItem(key, value) {
		this.values[key] = value;
	}
}

/**
 * Normalizes Directus urls.
 */
function normalizeEndpoint(endpoint, query = {}) {
	const url = new URL(endpoint);
	if (!url.pathname.endsWith('/')) {
		url.pathname = `${url.pathname}/`;
	}

	Object.entries(query)
		.filter(([key, value]) => value !== undefined)
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
	} catch (err) {
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
			console.log(
				chalk.yellowBright(
					'\nWARNING! `gatsby-source-directus` has both token and credentials set. Only token will be used.\n'
				)
			);
		}
	} else {
		console.log(
			chalk.yellowBright(
				'\nWARNING! `gatsby-source-directus` no auth set. source will fetch only public accessible items.\n'
			)
		);
	}

	let endpointParams = {};
	if (hasAuth && hasToken) {
		endpointParams.access_token = auth?.token;
	}

	let endpoints = normalizeEndpoint(url, endpointParams);
	invariant(endpoints !== null, `\`gatsby-source-directus\` requires a valid \`url\``);

	let refreshInterval = typeof dev?.refresh === 'string' ? ms(dev.refresh) / 1000 : dev?.refresh || 15;
	invariant(
		!Number.isNaN(refreshInterval),
		`\`gatsby-source-directus\` requires a valid \`dev.refresh\` to be specified.\n` +
			`can be either a number (seconds) or a string (5s, 1m, ...)`
	);

	const directus = new Directus(endpoints.base, {
		auth: {
			mode: 'json',
			autoRefresh: true,
			storage: new MemoryStore(),
		},
	});

	if (hasAuth && !hasToken) {
		try {
			await directus.auth.login({
				email: auth?.email,
				password: auth?.password,
			});
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

		if (!hasToken) {
			return obj;
		}

		return Object.assign(obj, {
			Authorization: `Bearer ${directus.auth.token}`,
		});
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
 exports.createResolvers = async ({
	actions,
	cache,
	createNodeId,
	createResolvers,
	store,
	reporter,
  }, options) => {
	const { createNode } = actions;
	
	const { url } = options;

	let endpoints = normalizeEndpoint(url);
  
	await createResolvers({
	  DirectusData_directus_files: {
		imageFile: {
		  type: "File",
		  async resolve(source) {
			if (!source || !source.id) {
			  return null;
			}
			return await createRemoteFileNode({
			  url: `${endpoints.base}assets/${source.id}`,
			  store,
			  cache,
			  createNode,
			  createNodeId,
			  reporter,
			});
		  },
		},
	  },
	});
  };
