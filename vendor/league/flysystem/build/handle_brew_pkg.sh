#!/usr/bin/env bash

if [[ "$#" -eq 1 ]]; then
    echo "Handling \"$1\" brew package..."
else
    echo "Brew failed - invalid $0 call"
    exit 1;
fi

if [[ $(brew ls --versions "$1") ]]; then
    if brew outdated "$1"; then
        echo "Package upgrade is not required, skipping"
    else
        echo "Updating package...";
        brew upgrade "$1"
        if [ $? -ne 0 ]; then
            echo "Upgrade failed"
            exit 1
        fi
    fi
else
    echo "Package not available - installing..."
    brew install "$1"
    if [ $? -ne 0 ]; then
        echo "Install failed"
        exit 1
    fi
fi

echo "Linking installed package..."
brew link "$1"
