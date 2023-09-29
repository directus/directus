# @directus/sdk-schema-generator

Generating a typescript schema definition for the SDK

## Description

This package exports re-usable logic for generating a typescript schema to be used with the SDK.

### CLI

```
Usage: directus-sdk-schema generate [options]

Generate a *.ts file

Options:
  -h, --host <host>
  -t, --access-token <token>
  -f, --file <file>           Write the output to a file
  -n, --naming <naming>       Select naming strategy (choices: "database", "camelcase",
                              "pascalcase", default: "database")
  --help                      display help for command
```

The access token needs to have admin permissions to access the required endpoints.
