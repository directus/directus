import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import { createRequire } from "node:module";
import {
	ItemsService,
	ActivityService,
	CollectionsService,
	DashboardsService,
	FieldsService,
	NotificationsService,
	OperationsService,
	PanelsService,
	PresetsService,
	RelationsService,
	RevisionsService,
	ServerService,
	SettingsService,
	SharesService,
	TranslationsService,
	WebhooksService,
	WebSocketService,
	UtilsService
} from "../../../services/index.js";
import { getSchema } from "../../../utils/get-schema.js";
import { createVMError } from "../create-error.js";
import { ExtensionServiceError } from "../../../errors/extension-permissions.js";


const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

type ApiServices = 'items' | 'assets' | 'activity' | 'collections' | 'dashboards' | 'fields' | 'files' | 'import' | 'export' | 'notifications' | 'operations' | 'panels' | 'permissions' | 'presets' | 'relations' | 'revisions' | 'roles' | 'server' | 'settings' | 'shares' | 'translations' | 'users' | 'utils' | 'webhooks' | 'websocket'

export class ApiServiceVMFunction extends VMFunction {
	override async prepareContext(context: Context, extension: ApiExtensionInfo): Promise<void> {

		const schema = await getSchema()

		await context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(function (type: ApiServices, ...args: any[]) {

				switch (type) {
					case 'items':
						return createReference(type, new ItemsService(args[0], { schema }), args[0])
					case 'activity':
						return createReference(type, new ActivityService({ schema }))
					case 'collections':
						return createReference(type, new CollectionsService({ schema }))
					case 'dashboards':
						return createReference(type, new DashboardsService({ schema }))
					case 'fields':
						return createReference(type, new FieldsService({ schema }))
					case 'notifications':
						return createReference(type, new NotificationsService({ schema }))
					case 'operations':
						return createReference(type, new OperationsService({ schema }))
					case 'panels':
						return createReference(type, new PanelsService({ schema }))
					case 'presets':
						return createReference(type, new PresetsService({ schema }))
					case 'relations':
						return createReference(type, new RelationsService({ schema }))
					case 'revisions':
						return createReference(type, new RevisionsService({ schema }))
					case 'server':
						return createReference(type, new ServerService({ schema }))
					case 'settings':
						return createReference(type, new SettingsService({ schema }))
					case 'shares':
						return createReference(type, new SharesService({ schema }))
					case 'translations':
						return createReference(type, new TranslationsService({ schema }))
					case 'utils':
						return createReference(type, new UtilsService({ schema }))
					case 'webhooks':
						return createReference(type, new WebhooksService({ schema }))
					case 'websocket':
						return createReference(type, new WebSocketService())
					default:
						return new ivm.ExternalCopy(new Error('Service does not exist')).copyInto()


				}
			})
		])

		function createReference(type: string, service: any, collection?: string) {
			const permission = extension.granted_permissions.find(perm => perm.permission === `service.${type}`)

			if (permission?.enabled !== true) {
				return createVMError(new ExtensionServiceError({ service: type, reason: 'Permission denied' }))
			}

			if (type === 'items') {
				if (!collection) {
					return createVMError(new ExtensionServiceError({ service: type, reason: 'No collection provided' }))
				}

				const allowedCollections = permission.options?.['allowed_collections']
				const extensionCollections = Boolean(permission.options?.['extension_collections'])

				let dbPrefix = extension.name.toLowerCase().replaceAll(/[^a-z]/, '_')

				if (dbPrefix.startsWith('_')) {
					dbPrefix = dbPrefix.substring(1)
				}

				dbPrefix = 'extension_' + dbPrefix + "_"

				if ((allowedCollections && Array.isArray(allowedCollections) && allowedCollections.includes(collection)) || (extensionCollections && collection.startsWith(dbPrefix))) {
					return createVMError(new ExtensionServiceError({ service: type, reason: `Access of ${collection} Collection not allowed.` }))

				}
			}

			return new ivm.Reference(function (resolve: any, reject: any, prop: string, args: any[]) {

				if (prop in service === false || prop === 'createMutationTracker') {
					reject.apply(null, [createVMError(new ExtensionServiceError({ service: type, reason: `Method ${prop} not found` }))])
					return
				}

				const argWithFunc = args.map(arg => {
					if (arg instanceof ivm.Reference) {
						return (...callbackArgs: any[]) => {
							arg.applyIgnored(null, callbackArgs)
						}
					}

					return arg
				})

				service[prop](...argWithFunc).then((result: any) => {
					resolve.apply(null, [new ivm.ExternalCopy(result).copyInto()])
				}).catch((err: any) => {
					reject.apply(null, [new ivm.ExternalCopy(err).copyInto()])
				})
			})
		}
	}
}
