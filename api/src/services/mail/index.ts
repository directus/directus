import fse from 'fs-extra';
import { Knex } from 'knex';
import { Liquid } from 'liquidjs';
import path from 'path';
import database from '../../database';
import env from '../../env';
import logger from '../../logger';
import { AbstractServiceOptions, Accountability, SchemaOverview } from '../../types';
import mailer from '../mailer';
import { SendMailOptions } from 'nodemailer';

const liquidEngine = new Liquid({
	root: [path.resolve(env.EXTENSIONS_PATH, 'templates'), path.resolve(__dirname, 'templates')],
	extname: '.liquid',
});

export type EmailOptions = SendMailOptions & {
	template?: {
		name: string;
		data: Record<string, any>;
		system?: boolean;
	};
};

export class MailService {
	schema: SchemaOverview;
	accountability: Accountability | null;
	knex: Knex;

	constructor(opts: AbstractServiceOptions) {
		this.schema = opts.schema;
		this.accountability = opts.accountability || null;
		this.knex = opts?.knex || database;
	}

	async send(options: EmailOptions): Promise<void> {
		if (!mailer) return;

		const { template, ... nodeMailerOptions } = options;
		let { html } = options;

		let from = options.from || (env.EMAIL_FROM as string);

		if (template) {
			let templateData = template.data;

			if (template.system === true) {
				const defaultTemplateData = await this.getDefaultTemplateData();

				templateData = {
					...defaultTemplateData,
					...templateData,
				};
			}

			html = await this.renderTemplate(template.name, templateData, template.system);
		}

		try {
			await mailer.sendMail({ ...nodeMailerOptions, from, html });
		} catch (error) {
			logger.warn('[Email] Unexpected error while sending an email:');
			logger.warn(error);
		}
	}

	private async renderTemplate(template: string, variables: Record<string, any>, system = false) {
		const resolvedPath = system
			? path.resolve(env.EXTENSIONS_PATH, 'templates', template + '.liquid')
			: path.join(__dirname, 'templates', template + '.liquid');

		const templateString = await fse.readFile(resolvedPath, 'utf8');
		const html = await liquidEngine.parseAndRender(templateString, variables);

		return html;
	}

	private async getDefaultTemplateData() {
		const projectInfo = await this.knex
			.select(['project_name', 'project_logo', 'project_color'])
			.from('directus_settings')
			.first();

		return {
			projectName: projectInfo?.project_name || 'Directus',
			projectColor: projectInfo?.project_color || '#546e7a',
			projectLogo: getProjectLogoURL(projectInfo?.project_logo),
		};

		function getProjectLogoURL(logoID?: string) {
			let projectLogoURL = env.PUBLIC_URL;
			if (projectLogoURL.endsWith('/') === false) {
				projectLogoURL += '/';
			}
			if (logoID) {
				projectLogoURL += `assets/${logoID}`;
			} else {
				projectLogoURL += `admin/img/directus-white.png`;
			}
			return projectLogoURL;
		}
	}
}
