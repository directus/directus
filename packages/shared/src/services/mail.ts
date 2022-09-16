import { Knex } from 'knex';
import { SendMailOptions, Transporter } from 'nodemailer';
import { Accountability, SchemaOverview } from '../types';
export declare type EmailOptions = SendMailOptions & {
	template?: {
		name: string;
		data: Record<string, any>;
	};
};
export declare interface MailService {
	schema: SchemaOverview;
	accountability: Accountability | null;
	knex: Knex;
	mailer: Transporter;
	send(options: EmailOptions): Promise<void>;
}
