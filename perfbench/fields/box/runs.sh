#!/bin/bash
cd ~/perfbench-fm
./run.sh big bench-big 1 5 baseline fieldsmap && \
./run.sh stock bench-stock 1 5 baseline fieldsmap && \
./run.sh big bench-big 4 3 baseline fieldsmap && \
./run.sh stock bench-stock 4 3 baseline fieldsmap && echo ALL-DONE
