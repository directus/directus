FROM httpd:latest

ENV API_URL=https://demo-api.directus.app

COPY . /usr/local/apache2/htdocs
COPY config_example.js /usr/local/apache2/htdocs/config.js

RUN echo '#!/bin/bash\n\
sed -i 's#https://demo-api.directus.app#'$API_URL'#g' /usr/local/apache2/htdocs/config.js\n\
httpd-foreground\n\
exec "$@"\n'\
>> /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

