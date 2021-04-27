import mailer from '../mailer';
import { AbstractServiceOptions, Accountability, SchemaOverview } from '../../types';
import { Knex } from 'knex';
import database from '../../database';
import env from '../../env';
import logger from '../../logger';
import fse from 'fs-extra';
import { Liquid } from 'liquidjs';
import path from 'path';

const liquidEngine = new Liquid({
	root: [path.resolve(env.EXTENSIONS_PATH, 'templates'), path.resolve(__dirname, 'templates')],
	extname: '.liquid',
});

export type EmailOptions = {
	to: string;
	template?: {
		name: string;
		data: Record<string, any>;
		system?: boolean;
	};
	from?: string;
	subject?: string;
	text?: string;
	html?: string;
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

	async send(options: EmailOptions) {
		if (!mailer) return;

		let { to, from, subject, html, text } = options;

		from = from || (env.EMAIL_FROM as string);

		if (options.template) {
			let templateData = options.template.data;

			if (options.template.system === true) {
				const defaultTemplateData = await this.getDefaultTemplateData();

				templateData = {
					...defaultTemplateData,
					...templateData,
				};
			}

			html = await this.renderTemplate(options.template.name, templateData, options.template.system);
		}

		try {
			await mailer.sendMail({ to, from, subject, html, text });
		} catch (error) {
			logger.warn('[Email] Unexpected error while sending an email:');
			logger.warn(error);
		}
	}

	private async renderTemplate(template: string, variables: Record<string, any>, system: boolean = false) {
		const resolvedPath = system
			? path.join(__dirname, 'templates', template + '.liquid')
			: path.resolve(env.EXTENSIONS_PATH, 'templates', template + '.liquid');

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
