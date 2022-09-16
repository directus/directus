import { MutationOptions, Notification, PrimaryKey } from '../types';
import { ItemsService } from './items';
import { MailService } from './mail';
import { UsersService } from './users';
export declare interface NotificationsService extends ItemsService {
	usersService: UsersService;
	mailService: MailService;
	createOne(data: Partial<Notification>, opts?: MutationOptions): Promise<PrimaryKey>;
	createMany(data: Partial<Notification>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	sendEmail(data: Partial<Notification>): Promise<void>;
}
