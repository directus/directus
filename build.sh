#!/bin/bash
git branch -D build;
git stash;
git checkout --orphan build;
ls -lac | grep -v "\(\.git\|dist$\)" | xargs git rm -rf;
git rm .gitignore -f;
mv ./dist/* ./;
rm -rf ./dist;
git rm -r --cached ./api/vendor;
git add ./api/vendor;
git add . --all;
git commit -a -m "Init build";
git checkout dev;
git stash pop;