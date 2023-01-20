import { afterEach, beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest';
import { ItemsService, NotificationsService } from '.';

vi.mock('../env', async () => {
	const actual = (await vi.importActual('../env')) as { default: Record<string, any> };
	const MOCK_ENV = {
		...actual.default,
		PUBLIC_URL: '/',
	};
	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

describe('Integration Tests', () => {
	describe('Services / Notifications', () => {
		let service: NotificationsService;

		beforeEach(() => {
			service = new NotificationsService({
				schema: { collections: {}, relations: [] },
			});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		describe('createOne', () => {
			let superCreateOneSpy: SpyInstance;
			let thisSendEmailSpy: SpyInstance;

			beforeEach(() => {
				superCreateOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(0);
				thisSendEmailSpy = vi.spyOn(NotificationsService.prototype, 'sendEmail').mockResolvedValue();
			});

			it('create a notification and send email', async () => {
				const data = {
					recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				};
				await service.createOne(data);

				expect(superCreateOneSpy).toHaveBeenCalled();
				expect(superCreateOneSpy).toBeCalledWith(data, undefined);
				expect(thisSendEmailSpy).toHaveBeenCalled();
				expect(thisSendEmailSpy).toBeCalledWith(data);
			});
		});

		describe('createMany', () => {
			let superCreateManySpy: SpyInstance;
			let thisSendEmailSpy: SpyInstance;

			beforeEach(() => {
				superCreateManySpy = vi.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([]);
				thisSendEmailSpy = vi.spyOn(NotificationsService.prototype, 'sendEmail').mockResolvedValue();
			});

			it('create many notifications and send email for notification', async () => {
				const data = [
					{
						recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
						sender: null,
						subject: 'Notification Subject',
						message: 'Notification Message',
					},
					{
						recipient: '51260c36-e944-4b0a-a370-dc83070d9d2b',
						sender: null,
						subject: 'Notification Subject',
						message: 'Notification Message',
					},
				];
				await service.createMany(data);

				expect(superCreateManySpy).toBeCalledTimes(1);
				expect(superCreateManySpy).toBeCalledWith(data, undefined);
				expect(thisSendEmailSpy).toBeCalledTimes(data.length);
			});
		});

		describe('sendEmail', () => {
			let usersServiceReadOneSpy: SpyInstance;
			let mailServiceSendSpy: SpyInstance;

			beforeEach(() => {
				usersServiceReadOneSpy = vi.spyOn(service.usersService, 'readOne').mockResolvedValue({});
				mailServiceSendSpy = vi.spyOn(service.mailService, 'send').mockResolvedValue(0);
			});

			it('do nothing when there is no recipient', async () => {
				await service.sendEmail({
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				});

				expect(usersServiceReadOneSpy).not.toHaveBeenCalled();
			});

			it('read recipient detail from userService when there is recipient', async () => {
				usersServiceReadOneSpy.mockReturnValue(Promise.resolve({ id: '5aa7ffb5-bd54-46ab-8654-6dfead39694d' }));

				await service.sendEmail({
					recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				});

				expect(usersServiceReadOneSpy).toHaveBeenCalled();
			});

			it('do not send email when user does not have email', async () => {
				usersServiceReadOneSpy.mockReturnValue(Promise.resolve({ id: '5aa7ffb5-bd54-46ab-8654-6dfead39694d' }));

				await service.sendEmail({
					recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				});

				expect(usersServiceReadOneSpy).toHaveBeenCalled();
				expect(mailServiceSendSpy).not.toHaveBeenCalled();
			});

			it('do not send email when user have email but disabled email notification', async () => {
				usersServiceReadOneSpy.mockReturnValue(
					Promise.resolve({
						id: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
						email: 'user@example.com',
						email_notifications: false,
					})
				);

				await service.sendEmail({
					recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				});

				expect(usersServiceReadOneSpy).toHaveBeenCalled();
				expect(mailServiceSendSpy).not.toHaveBeenCalled();
			});

			it('send email without url when user role does not have app access', async () => {
				const userDetail = {
					id: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					email: 'user@example.com',
					email_notifications: true,
					role: {
						app_access: false,
					},
				};
				usersServiceReadOneSpy.mockReturnValue(Promise.resolve(userDetail));

				const notificationDetail = {
					recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				};
				await service.sendEmail(notificationDetail);

				expect(usersServiceReadOneSpy).toHaveBeenCalled();
				expect(mailServiceSendSpy).toHaveBeenCalled();
				expect(mailServiceSendSpy).toHaveBeenCalledWith({
					template: {
						name: 'base',
						data: { html: `<p>${notificationDetail.message}</p>\n` },
					},
					to: userDetail.email,
					subject: notificationDetail.subject,
				});
			});

			it('send email with url when user role have app access', async () => {
				const userDetail = {
					id: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					email: 'user@example.com',
					email_notifications: true,
					role: {
						app_access: true,
					},
				};
				usersServiceReadOneSpy.mockReturnValue(Promise.resolve(userDetail));

				const notificationDetail = {
					recipient: '5aa7ffb5-bd54-46ab-8654-6dfead39694d',
					sender: null,
					subject: 'Notification Subject',
					message: 'Notification Message',
				};
				await service.sendEmail(notificationDetail);

				expect(usersServiceReadOneSpy).toHaveBeenCalled();
				expect(mailServiceSendSpy).toHaveBeenCalled();
				expect(mailServiceSendSpy).toHaveBeenCalledWith({
					template: {
						name: 'base',
						data: {
							url: `/admin/users/${userDetail.id}`,
							html: `<p>${notificationDetail.message}</p>\n`,
						},
					},
					to: userDetail.email,
					subject: notificationDetail.subject,
				});
			});
		});
	});
});
