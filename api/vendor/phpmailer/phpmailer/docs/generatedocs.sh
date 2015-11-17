#!/bin/sh
# Regenerate PHPMailer documentation
# Run from within the docs folder
rm -rf phpdoc/*
phpdoc --directory .. --target ./phpdoc --ignore test/,examples/,extras/,test_script/,vendor/,language/ --sourcecode --force --title PHPMailer --template="clean"
# You can merge regenerated docs into a separate docs working copy without messing up the git status like so:
# rsync -a --delete --exclude ".git" --exclude "phpdoc-cache-*/" --exclude "README.md" phpdoc/ ../../phpmailer-docs
# After updating docs, push/PR them to the phpmailer gh-pages branch: https://github.com/PHPMailer/PHPMailer/tree/gh-pages
