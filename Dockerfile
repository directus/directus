# NOTE: Testing Only. DO NOT use this in production

ARG NODE_VERSION=16-alpine

FROM node:${NODE_VERSION}

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

WORKDIR /directus

COPY . .

RUN npm install

WORKDIR /directus/api

CMD ["sh", "-c", "node ./cli.js bootstrap && node ./start.js;"]
EXPOSE 8055/tcp
