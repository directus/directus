import type { SendMailOptions } from 'nodemailer';

export type EmailOptions = Omit<SendMailOptions, 'from'> & {
	from?: string;
	template?: {
		name: string;
		data: Record<string, any>;
	};
};
