import { Octokit } from "octokit"
import 'dotenv/config'

const GH_TOKEN = process.env['GITHUB_TOKEN'] ?? ''

export const octokit: Octokit = new Octokit({ auth: GH_TOKEN })
