import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import { createRequire } from "node:module";
import {
	ItemsService,
	AssetsService,
	ActivityService,
	CollectionsService,
	DashboardsService,
	FieldsService,
	FilesService,
	ImportService,
	ExportService,
	NotificationsService,
	OperationsService,
	PanelsService,
	PermissionsService,
	PresetsService,
	RelationsService,
	RevisionsService,
	RolesService,
	ServerService,
	SettingsService,
	SharesService,
	TranslationsService,
	UsersService,
	WebhooksService,
	WebSocketService
} from "../../../services/index.js";
import { getSchema } from "../../../utils/get-schema.js";


const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

type ApiServices = 'items' | 'assets' | 'activity' | 'collections' | 'dashboards' | 'fields' | 'files' | 'import' | 'export' | 'notifications' | 'operations' | 'panels' | 'permissions' | 'presets' | 'relations' | 'revisions' | 'roles' | 'server' | 'settings' | 'shares' | 'translations' | 'users' | 'webhooks' | 'websocket'

export class ApiServiceVMFunction extends VMFunction {
	override async prepareContext(context: Context, extension: ApiExtensionInfo): Promise<void> {

		const schema = await getSchema()

		await context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(function (type: ApiServices, ...args: any[]) {
				console.log("Api Service: ", type)

				switch (type) {
					case 'items':
						return createReference(new ItemsService(args[0], { schema }))
					case 'assets':
						return createReference(new AssetsService({ schema }))
					case 'activity':
						return createReference(new ActivityService({ schema }))
					case 'collections':
						return createReference(new CollectionsService({ schema }))
					case 'dashboards':
						return createReference(new DashboardsService({ schema }))
					case 'fields':
						return createReference(new FieldsService({ schema }))
					case 'files':
						return createReference(new FilesService({ schema }))
					case 'import':
						return createReference(new ImportService({ schema }))
					case 'export':
						return createReference(new ExportService({ schema }))
					case 'notifications':
						return createReference(new NotificationsService({ schema }))
					case 'operations':
						return createReference(new OperationsService({ schema }))
					case 'panels':
						return createReference(new PanelsService({ schema }))
					case 'permissions':
						return createReference(new PermissionsService({ schema }))
					case 'presets':
						return createReference(new PresetsService({ schema }))
					case 'relations':
						return createReference(new RelationsService({ schema }))
					case 'revisions':
						return createReference(new RevisionsService({ schema }))
					case 'roles':
						return createReference(new RolesService({ schema }))
					case 'server':
						return createReference(new ServerService({ schema }))
					case 'settings':
						return createReference(new SettingsService({ schema }))
					case 'shares':
						return createReference(new SharesService({ schema }))
					case 'translations':
						return createReference(new TranslationsService({ schema }))
					case 'users':
						return createReference(new UsersService({ schema }))
					case 'webhooks':
						return createReference(new WebhooksService({ schema }))
					case 'websocket':
						return createReference(new WebSocketService())
					default:
						return new ivm.ExternalCopy(new Error('Service does not exist')).copyInto()


				}
			})
		])

		function createReference(service: any) {
			return new ivm.Reference(function (resolve: any, reject: any, prop: string, args: any[]) {

				if (prop in service === false) {
					reject.apply(null, [new ivm.ExternalCopy(new Error('Method does not exist on service')).copyInto()])
					return
				}

				service[prop](...args).then((result) => {
					resolve.apply(null, [new ivm.ExternalCopy(result).copyInto()])
				}).catch((err) => {
					reject.apply(null, [new ivm.ExternalCopy(err).copyInto()])
				})
			})
		}
	}
}
