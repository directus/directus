# Installing Manually

<!-- prettier-ignore-start -->
::: tip Automation
We've created a little CLI tool you can run that does this process automatically. For more info, check the doc on [installing through the CLI](/guides/installation/cli).
:::
<!-- prettier-ignore-end -->

## 1. Setup a Project Folder

And add a `package.json` by running the following command.

```bash
npm init -y
```

We recommend aliasing the `start` script to Directus' start for easier deployments to services like
[AWS](/guides/installation/aws) or
[DigitalOcean App Platform](/guides/installation/digitalocean-app-platform).

```json
{
	"scripts": {
		"start": "directus start"
	}
}
```

## 2. Install Directus

```bash
npm install directus
```

## 3. Install one of the Database Drivers

Choose the [database vendor](/guides/installation/cli#databases) you will be working with, and
install its driver.

```bash
npm install pg
```

## 4. Install Optional Dependencies

At this point you have the option of installing other dependencies. If you're planning on utilizing
Redis/Memcached, make sure to install `ioredis`/`memcached` respectively.

## 5. Setup a Configuration File

Finally, you'll need to setup your `.env` file, or configure the environment variables through other
means, such as Docker, etc.

See [Environment Variables](/reference/environment-variables) for all available variables.
