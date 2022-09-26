# NOTE: Testing Only. DO NOT use this in production

ARG NODE_VERSION=16-alpine

FROM node:${NODE_VERSION}

ARG GITLAB_PIPELINE_TOKEN
ARG CI_API_V4_URL
ARG PAYMENT_EXTENSION

# Required to run OracleDB
# Technically not required for the others, but I'd rather have 1 image that works for all, instead of building n images
# per test
#WORKDIR /tmp
#RUN apk --no-cache add libaio libnsl libc6-compat curl && \
#    curl -o instantclient-basiclite.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip -SL && \
#    unzip instantclient-basiclite.zip && \
#    mv instantclient*/ /usr/lib/instantclient && \
#    rm instantclient-basiclite.zip && \
#    ln -s /usr/lib/instantclient/libclntsh.so.19.1 /usr/lib/libclntsh.so && \
#    ln -s /usr/lib/instantclient/libocci.so.19.1 /usr/lib/libocci.so && \
#    ln -s /usr/lib/instantclient/libociicus.so /usr/lib/libociicus.so && \
#    ln -s /usr/lib/instantclient/libnnz19.so /usr/lib/libnnz19.so && \
#    ln -s /usr/lib/libnsl.so.2 /usr/lib/libnsl.so.1 && \
#    ln -s /lib/libc.so.6 /usr/lib/libresolv.so.2 && \
#    ln -s /lib64/ld-linux-x86-64.so.2 /usr/lib/ld-linux-x86-64.so.2
#
#ENV ORACLE_BASE /usr/lib/instantclient
#ENV LD_LIBRARY_PATH /usr/lib/instantclient
#ENV TNS_ADMIN /usr/lib/instantclient
#ENV ORACLE_HOME /usr/lib/instantclient

RUN apk update
RUN apk --no-cache add --virtual builds-deps build-base python3 openssh-client bash git openssh curl
RUN apk add nano

WORKDIR /directus

COPY . .

RUN apk add --update python3 make g++\
   && rm -rf /var/cache/apk/*

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm -r build

# Custom Extensions
RUN pnpm install @wellenplan/directus-extension-duration-display -w

#COPY ./custom_extensions.sh ./custom_extensions.sh
RUN export GITLAB_PIPELINE_TOKEN=${GITLAB_PIPELINE_TOKEN}
RUN export CI_API_V4_URL=${CI_API_V4_URL}
RUN chmod +x ./custom_extensions.sh
RUN chmod +x ./payment_extensions.sh
RUN ./custom_extensions.sh

RUN if [[ -z "$PAYMENT_EXTENSION" ]] ; then echo "Payment extension disabled" ; else ./payment_extensions.sh ; fi

# Not sure why we have this folder here
RUN rm -rf /directus/api/extensions/modules/__MACOSX || true

WORKDIR /directus/api

RUN mkdir -p ./uploads
RUN mkdir -p ./snapshots

#CMD ["sh", "-c", "node ./cli.js bootstrap && node ./cli.js schema apply --yes ./snapshots/* || true && node ./dist/start.js;"]
CMD ["sh", "-c", "node ./cli.js bootstrap && for snapshots_file in ./snapshots/*.yaml; do echo $snapshots_file; node ./cli.js schema apply --yes $snapshots_file || true; done && node ./dist/start.js;"]
EXPOSE 8055/tcp
