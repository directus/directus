FROM docker:stable

RUN \
  apk update && \
  apk upgrade && \
  apk add bash

COPY ./rootfs/ /

RUN \
  chmod +x /usr/bin/lib/argsf && \
  chmod +x /usr/bin/entrypoint && \
  chmod +x /usr/bin/semver

ENTRYPOINT ["entrypoint"]
