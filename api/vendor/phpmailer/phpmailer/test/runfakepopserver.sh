#!/usr/bin/env bash

# Run the fake pop server from bash
# Idea from http://blog.ale-re.net/2007/09/ipersimple-remote-shell-with-netcat.html
# Defaults to port 1100 so it can be run by unpriv users and not clash with a real server
# Optionally, pass in a port number as the first arg

mkfifo fifo
nc -l ${1:-1100} <fifo |bash ./fakepopserver.sh >fifo
rm fifo
