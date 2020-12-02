# Caddy Setup Guide

Run

```bash
caddy reverse-proxy --to 127.0.0.1:8055
```

or setup a caddy file with the following contents:

```
localhost

reverse_proxy 127.0.0.1:8055
```
