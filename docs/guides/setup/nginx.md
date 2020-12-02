# Nginx Setup Guide

You can configure `/etc/nginx/sites-available/default` with the following config to use it as a
reverse proxy to Directus:

```
. . .
    location / {
        proxy_pass http://localhost:8055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
