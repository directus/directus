const ms = require('ms');
const chalk = require('chalk');
const { Directus } = require('@directus/sdk');
const { sourceNodes, createSchemaCustomization } = require('gatsby-source-graphql/gatsby-node');
const { createRemoteFileNode } = require('gatsby-source-filesystem');

/**
 * Validate plugin options
 */
exports.pluginOptionsSchema = ({ Joi }) => {
	return Joi.object().keys({
		url: Joi.string().required(),
		auth: Joi.object()
			.keys({
				token: Joi.string(),
				email: Joi.string(),
				password: Joi.string(),
			})
			.with('email', 'password')
			.with('password', 'email')
			.xor('token', 'email'),
		type: Joi.object()
			.keys({
				name: Joi.string(),
				field: Joi.string(),
			})
			.optional(),
		dev: Joi.object().keys({
			refresh: [Joi.number(), Joi.string()],
		}),
		graphql: Joi.object(),
	});
};

/**
 * Gatsby source implementation.
 */
exports.sourceNodes = async (gatsbyOptions, pluginOptions) => {
	plugin.setOptions(pluginOptions);

	const optionsSystem = plugin.getOptionsSystem();
	const options = plugin.getOptions();

	const createNode = gatsbyOptions.actions.createNode;

	// Avoid type conflict with gatsby-source-graphql
	gatsbyOptions.actions.createNode = (node) => {
		if (node.internal.type === 'GraphQLSource') {
			if (node.typeName === optionsSystem.typeName) node.internal.type = 'DirectusSystemGraphQLSource';
			if (node.typeName === options.typeName) node.internal.type = 'DirectusGraphQLSource';
		}

		return createNode(node);
	};

	await sourceNodes(gatsbyOptions, optionsSystem);
	await sourceNodes(gatsbyOptions, options);
};

exports.createSchemaCustomization = async (gatsby, pluginOptions) => {
	plugin.setOptions(pluginOptions);

	await createSchemaCustomization(gatsby, plugin.getOptionsSystem());
	await createSchemaCustomization(gatsby, plugin.getOptions());
};

/**
 * Gatsby file implementation.
 */
exports.createResolvers = async ({ actions, cache, createNodeId, createResolvers, store, reporter }, pluginOptions) => {
	plugin.setOptions(pluginOptions);

	const { createNode } = actions;

	const { headers } = await plugin.getOptions();
	const { Authorization } = await headers();

	const fileResolver = {
		imageFile: {
			type: `File`,
			resolve(source) {
				if (!source || !source.id) {
					return null;
				}
				return createRemoteFileNode({
					url: `${plugin.url}assets/${source.id}`,
					store,
					cache,
					createNode,
					createNodeId,
					httpHeaders: { Authorization },
					reporter,
				});
			},
		},
	};

	await createResolvers({
		DirectusData_directus_files: fileResolver,
		DirectusSystemData_directus_files: fileResolver,
	});
};

class Plugin {
	constructor() {
		this.authToken = '';
		this.options = null;
		this.urlGraphqlSystem = '';
		this.urlGraphql = '';
		this.url = '';
		this.refreshInterval = 0;
	}

	setOptions(options) {
		const { url, dev, auth } = options;

		if (isEmpty(url)) error('"url" must be defined');

		const hasAuth = !!auth;
		const hasToken = !isEmpty(auth?.token);
		const hasEmail = !isEmpty(auth?.email);
		const hasPassword = !isEmpty(auth?.password);
		const hasCredentials = hasEmail && hasPassword;

		if (hasAuth && !hasToken && !hasCredentials)
			error('"auth.token" or ("auth.email" and "auth.password") must be defined');

		if (hasAuth && !hasToken) error('("auth.email" and "auth.password") must be defined if "auth.token" is not set');

		if (hasToken && hasCredentials)
			warning('"auth.token", "auth.email" and "auth.password" are all set, but only "auth.token" will be used');

		if (!hasAuth) warning('no "auth" option were defined. Resources will be fetched with public role');

		if (hasToken) this.authToken = auth.token;

		try {
			const baseUrl = new URL(url);

			baseUrl.pathname = '/';
			this.url = baseUrl.toString();

			baseUrl.pathname = '/graphql';
			this.urlGraphql = baseUrl.toString();

			baseUrl.pathname = '/graphql/system';
			this.urlGraphqlSystem = baseUrl.toString();
		} catch (err) {
			error('"url" should be a valid URL');
		}

		this.refreshInterval = typeof dev?.refresh === 'string' ? ms(dev.refresh) / 1000 : dev?.refresh || 15;

		if (Number.isNaN(this.refreshInterval))
			error('"dev.refresh" should be a number in seconds or a string with ms format, i.e. 5s, 5m, 5h, ...');

		this.options = options;
	}

	getOptions() {
		const internalOptions = ['url', 'dev', 'auth', 'type'];
		const gatsbyPluginOptions = Object.fromEntries(
			Object.entries(this.options).flatMap(([key, value]) => (internalOptions.includes(key) ? [] : [[key, value]]))
		);

		return {
			...this.options.graphql,
			...gatsbyPluginOptions,
			url: this.urlGraphql,
			typeName: this.options?.type?.name || 'DirectusData',
			fieldName: this.options?.type?.field || 'directus',
			headers: this.headers.bind(this),
		};
	}

	getOptionsSystem() {
		const options = this.getOptions();

		return {
			...options,
			url: this.urlGraphqlSystem,
			typeName: this.options?.type?.system_name || 'DirectusSystemData',
			fieldName: this.options?.type?.system_field || 'directus_system',
		};
	}

	async headers() {
		let headers = {};
		if (typeof this.options?.headers === 'object') {
			Object.assign(headers, this.options.headers || {});
		} else if (typeof this.options?.headers === 'function') {
			Object.assign(headers, (await this.options.headers()) || {});
		}

		if (!this.authToken) {
			const directus = new Directus(this.url);
			this.authToken = await directus.auth
				.login({
					email: this.options?.auth?.email,
					password: this.options?.auth?.password,
				})
				.then((r) => r.access_token)
				.catch((err) => {
					error(`authentication failed with: ${err.message}\nAre credentials valid?`);
				});
		}

		if (this.authToken) {
			Object.assign(headers, {
				Authorization: `Bearer ${this.authToken}`,
			});
		}

		return headers;
	}
}

class Log {
	static log(level, message) {
		let color = level === 'error' ? 'red' : level === 'warning' ? 'yellow' : 'white';

		// eslint-disable-next-line no-console
		console.log(chalk.cyan('gatsby-source-directus'), ':', chalk[color](message));
	}
	static error(message) {
		Log.log('error', message);
	}
	static warning(message) {
		Log.log('error', message);
	}
}

function isEmpty(value) {
	if (value?.constructor === String) return value.length === 0;

	return true;
}

function error(message) {
	Log.error(message);

	const error = new Error(`gatsby-source-directus: ${message}`);
	error.stack = undefined;

	throw error;
}

function warning(message) {
	Log.warning(message);
}

const plugin = new Plugin();
