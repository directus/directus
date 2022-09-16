import { Item, PrimaryKey, MutationOptions } from '../types';
import { ItemsService } from './items';
import { NotificationsService } from './notifications';
import { UsersService } from './users';
export declare interface ActivityService extends ItemsService {
	notificationsService: NotificationsService;
	usersService: UsersService;
	createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
}
