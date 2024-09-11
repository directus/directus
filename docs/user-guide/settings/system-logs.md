---
description: System Logs provide real-time visibility into application logs, enabling monitoring and debugging of API requests.
---

# System Logs

System Logs, released in Directus 11.1.0, shows the Directus application logs in real-time. This is useful for debugging
and monitoring the Directus application as it runs.

![Two panes - one showing the logs and the other showing the full query of the selected item, along with log level and timestamp.](https://product-team.directus.app/assets/9f93fb8e-a433-41d7-898c-f7aa455c684a.png)

Logs are shown in the System Logs pane in realtime as the Directus application receives queries originating from the
Data Studio or API.

Each log message contains the following information:

- `level` - The log level of the message.
- `time` - The timestamp of the log message.
- `msg` - The message of the log containing the method and path.

:::info Ephemeral Logs

System Logs are ephemeral and not stored in the database. They are only available while the realtime connection is
active. Refreshing the page will clear the logs.

:::

## Log Levels

Under the hood, Directus uses [pino](https://github.com/pinojs/pino) for logging and uses the log levels provided by the
library:

| Log Level | Numeric Value |
| --------- | ------------- |
| `trace`   | 10            |
| `debug`   | 20            |
| `info`    | 30            |
| `warn`    | 40            |
| `error`   | 50            |
| `fatal`   | 60            |

You can enable different log levels via the
[`LOG_LEVEL` environment variable](/self-hosted/config-options.html#general).

## Searching & Filtering

If running multiple instances of Directus in a horizontally-scaled setup, you can also filter the logs by instance in
the System Logs pane.

You can also filter the logs by level, or filter by search terms in the `msg` field.
