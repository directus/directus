# Installing Manually

::: tip Automation

We've created a little CLI tool you can run that does this process automatically. For more info, check the doc on
[installing through the CLI](/guides/installation/cli).

:::

## 1. Setup a Project Folder

Create a new directory, and add a `package.json` by running the following command.

```bash
npm init -y
```

We recommend aliasing the `start` script to Directus' start for easier deployments to services like
[AWS](/guides/installation/aws) or [DigitalOcean App Platform](/guides/installation/digitalocean-app-platform).

```json
{
	...
	"scripts": {
		"start": "directus start"
	}
	...
}
```

## 2. Install Directus

```bash
npm install directus
```

## 3. Setup a Configuration File

Finally, you'll need to setup your `.env` file, or configure the environment variables through other means, such as
Docker, etc.

You can use a copy of [the `example.env` file](https://github.com/directus/directus/blob/main/api/example.env) as a
starting point.

See [Environment Variables](/reference/environment-variables) for all available variables.
