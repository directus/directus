#!/usr/bin/env node
'use strict';

const commander = require('commander');
const pkg = require('./package.json');

const program = new commander.Command(pkg.name);

program
    .version(pkg.version)
    .arguments('<directory>')
    .description('Create a new Directus project')
    .action(directory => {
        console.log(directory);
    })
    .parse(process.argv);