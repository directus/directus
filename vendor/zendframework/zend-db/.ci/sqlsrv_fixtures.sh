#!/usr/bin/env bash

echo "Configure SQL server test database"

sqlcmd -S localhost -U sa -P Password123 -Q "CREATE DATABASE zenddb_test;"
