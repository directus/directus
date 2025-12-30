import { useEmailRateLimiterQueue } from './rate-limiter.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import getMailer from '../../mailer.js';
import { Url } from '../../utils/url.js';
import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, Accountability, SchemaOverview } from '@directus/types';
import { isObject } from '@directus/utils';
import fse from 'fs-extra';
import type { Knex } from 'knex';
import { Liquid } from 'liquidjs';
import type { SendMailOptions, Transporter } from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const env = useEnv();
const logger = useLogger();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const liquidEngine = new Liquid({
	root: [path.resolve(env['EMAIL_TEMPLATES_PATH'] as string), path.resolve(__dirname, 'templates')],
	extname: '.liquid',
});

export type EmailOptions = SendMailOptions & {
	template?: {
		name: string;
		data: Record<string, any>;
	};
};

export type DefaultTemplateData = {
	projectName: string;
	projectColor: string;
	projectLogo: string;
	projectUrl: string;
};

export class MailService {
	schema: SchemaOverview;
	accountability: Accountability | null;
	knex: Knex;
	mailer: Transporter;

	constructor(opts: AbstractServiceOptions) {
		this.schema = opts.schema;
		this.accountability = opts.accountability || null;
		this.knex = opts?.knex || getDatabase();
		this.mailer = getMailer();

		if (env['EMAIL_VERIFY_SETUP']) {
			this.mailer.verify((error) => {
				if (error) {
					logger.warn(`Email connection failed:`);
					logger.warn(error);
				}
			});
		}
	}

	async send<T>(data: EmailOptions, options?: { defaultTemplateData: DefaultTemplateData }): Promise<T | null> {
		await useEmailRateLimiterQueue();

		const payload = await emitter.emitFilter(`email.send`, data, {});

		if (!payload) return null;

		const { template, ...emailOptions } = payload;

		let { html } = data;

		// option for providing tempalate data was added to prevent transaction race conditions with preceding promises
		const defaultTemplateData = options?.defaultTemplateData ?? (await this.getDefaultTemplateData());

		if (isObject(emailOptions.from) && (!emailOptions.from.name || !emailOptions.from.address)) {
			throw new InvalidPayloadError({ reason: 'A name and address property are required in the "from" object' });
		}

		const from: SendMailOptions['from'] = isObject(emailOptions.from)
			? emailOptions.from
			: {
					name: defaultTemplateData.projectName,
					address: (emailOptions.from as string) || (env['EMAIL_FROM'] as string),
				};

		if (template) {
			let templateData = template.data;

			templateData = {
				...defaultTemplateData,
				...templateData,
			};

			html = await this.renderTemplate(template.name, templateData);
		}

		if (typeof html === 'string') {
			// Some email clients start acting funky when line length exceeds 75 characters. See #6074
			html = html
				.split('\n')
				.map((line) => line.trim())
				.join('\n');
		}

		const info = await this.mailer.sendMail({ ...emailOptions, from, html });
		return info;
	}

	private async renderTemplate(template: string, variables: Record<string, any>) {
		const customTemplatePath = path.resolve(env['EMAIL_TEMPLATES_PATH'] as string, template + '.liquid');
		const systemTemplatePath = path.join(__dirname, 'templates', template + '.liquid');

		const templatePath = (await fse.pathExists(customTemplatePath)) ? customTemplatePath : systemTemplatePath;

		if ((await fse.pathExists(templatePath)) === false) {
			throw new InvalidPayloadError({ reason: `Template "${template}" doesn't exist` });
		}

		const templateString = await fse.readFile(templatePath, 'utf8');
		const html = await liquidEngine.parseAndRender(templateString, variables);

		return html;
	}

	async getDefaultTemplateData() {
		const projectInfo = await this.knex
			.select(['project_name', 'project_logo', 'project_color', 'project_url'])
			.from('directus_settings')
			.first();

		return {
			projectName: projectInfo?.project_name || 'Directus',
			projectColor: projectInfo?.project_color || '#171717',
			projectLogo: getProjectLogoURL(projectInfo?.project_logo),
			projectUrl: projectInfo?.project_url || '',
		};

		function getProjectLogoURL(logoID?: string) {
			const projectLogoUrl = new Url(env['PUBLIC_URL'] as string);

			if (logoID) {
				projectLogoUrl.addPath('assets', logoID);
			} else {
				projectLogoUrl.addPath('admin', 'img', 'directus-white.png');
			}

			return projectLogoUrl.toString();
		}
	}
}
