#!/bin/bash

# Assumes `cloc` executable
#   http://cloc.sourceforge.net/
#   Mac: brew install cloc

cloc --exclude-dir=api/vendor,api/vendor-manual,assets/js,assets/vendor,docs,dist,extensions/example,test/jasmine/vendor,test/qunit/vendor --exclude-list-file=cloc-exclude-files.txt .