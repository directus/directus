import { authentication, createDirectus, rest, type DirectusClient, type RestClient, type AuthenticationClient } from "@directus/sdk"
import type { Schema } from "./types.js"
import 'dotenv/config'

const client: DirectusClient<Schema> & RestClient<Schema> & AuthenticationClient<Schema> = createDirectus<Schema>(process.env['DIRECTUS_URL']!).with(rest()).with(authentication())

client.setToken(process.env['DIRECTUS_TOKEN']!)

export { client }
