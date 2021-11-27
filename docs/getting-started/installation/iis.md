# IIS (Internet Information Services)

Deploying directus to IIS will require [iisnode](https://github.com/Azure/iisnode), the IIS URL Rewrite module, an
entrypoint file, and some specific web.config configurations.

## iisnode

iisnode can be downloaded from the [azure/iisnode releases](https://github.com/Azure/iisnode/releases) page.

## IIS URL Rewrite module

The URL Rewrite module can be downloaded from the
[Microsoft IIS website](https://www.iis.net/downloads/microsoft/url-rewrite).

## Entrypoint

iisnode acts as a reverse proxy, and simply forwards requests to files based on any rewrite rules and the files
available. Since iisnode simply pipes requests to files, running the directus CLI directly won't work. To get around
this, use an entrypoint script like the `index.js` below.

```js
var { startServer } = require('directus/server');

startServer();
```

## web.config

With an entrypoint created, add a web.config to the root of the project. The following web.config is a simple example of
running directus with iisnode

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="iisnode" path="index.js" verb="*" modules="iisnode" />
      </handlers>
      <iisnode node_env="%node_env%" loggingEnabled="true" enableXFF="true" />
      <rewrite>
        <rules>
          <rule name="root">
            <match url="(.*)" />
            <action type="Rewrite" url="index.js" />
          </rule>
        </rules>
      </rewrite>
      <httpErrors existingResponse="PassThrough" />
    </system.webServer>
  </location>
</configuration>
```

A few important points regarding this file:

1. The iisnode handler `path` parameter is set to the entrypoint filepath
2. The iisnode handler `verb` parameter is set to handle all verbs (\*)
3. The iisnode `node_env` parameter is bound to the environment variable `node_env`
4. The iisnode `enableXFF` parameter is set to `true`. Since iisnode acts as a reverse proxy, this is required to pass
   client IP and other details on to the directus server, which directus modules expect and depend on.
5. The rewrite rule is in place to send all requests made to this site to the entrypoint, ensuring that directus handles
   the routing and not IIS
6. The error page response needs to be untouched by IIS for two-factor authentication to work.

While there are dozens even hundreds of options within IIS, this should help in getting started with Directus on IIS.
