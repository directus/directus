<?php

// Directus Project Config Example

// Directus config files control everything that the API needs to know in order to run a project.
// This includes database credentials, where to save files, and what social providers to allow

return [
    'database' => [
        'type' => 'mysql',          // Only mysql is supported
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'directus',
        'username' => 'root',
        'password' => 'root',
        'engine' => 'InnoDB',
        'charset' => 'utf8mb4',
        // 'socket' => '',          // Path to socket. Remove the `host` key above when using sockets
        // 'driver_options' => [    // Other MYSQL_PDO options. Can be used to connect to the database
        //                          // over an encrypted connection. For more information, see
        //                          // https://www.php.net/manual/en/ref.pdo-mysql.php#pdo-mysql.constants
        //    PDO::MYSQL_ATTR_SSL_CAPATH => '/etc/ssl/certs',
        // ]
    ],

    'cors' => [
        'enabled' => true,          // Enable or disable all CORS headers
        'origin' => ['*'],          // Access-Control-Allow-Origin
        'methods' => [              // Access-Control-Allow-Methods
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'HEAD',
        ],
        'headers' => [],            // Access-Control-Allow-Headers
        'exposed_headers' => [],    // Access-Control-Expose-Headers
        'max_age' => null,          // Access-Control-Allow-Max-Age
        'credentials' => false,     // Access-Control-Allow-Credentials
    ],

    'cookie' => [                   // Controls for the auth cookie mode
        'same_site' => 'Strict',    // Set the SameSite flag
        'secure' => false           // Add the Secure flag
    ],

    'rate_limit' => [
        'enabled' => false,         // Enable or disable all rate limiting
        'limit' => 100,             // Number of requests allowed...
        'interval' => 60,           // ...during this interval (in seconds)
        'adapter' => 'redis',       // Where to save the rate limit tmp data
        'host' => '127.0.0.1',
        'port' => 6379,
        'timeout' => 10             // Timeout from API to rate limit storage adapter
    ],

    'storage' => [
        'adapter' => 'local',       // What storage adapter to use for files
                                    // Defaults to the local filesystem. Other natively supported
                                    // options include: Amazon S3, Aliyun OSS, Azure
                                    // You'll need to require the correct flysystem adapters through Composer
                                    // See https://docs.directus.io/extensions/storage-adapters.html#using-aws-s3

        'root' => 'public/uploads/project-name/originals',          // Where files are stored on disk
        'thumb_root' => 'public/uploads/project-name/generated',    // Where thumbnails are stored on disk
        'root_url' => '/uploads/project-name/originals',            // Where files are accessed over the web

        'proxy_downloads' => false, // Use an internal proxy for downloading all files

        // S3
        ////////////////////////////////////////
        // 'key'    => 's3-key',
        // 'secret' => 's3-secret',
        // 'region' => 's3-region',
        // 'version' => 's3-version',
        // 'bucket' => 's3-bucket',
        // 'options' => [
        //    'ACL' => 'public-read',
        //    'CacheControl' => 'max-age=604800'
        // ],
        // 'endpoint' => 's3-endpoint',

        // Aliyun OSS
        ////////////////////////////////////////
        // 'OSS_ACCESS_ID' => 'aliyun-oss-id',
        // 'OSS_ACCESS_KEY' => 'aliyun-oss-key',
        // 'OSS_ENDPOINT' => 'aliyun-oss-endpoint',
        // 'OSS_BUCKET' => 'aliyun-oss-bucket',

        // Azure Blob Storage
        ////////////////////////////////////////
        // 'azure_connection_string' => 'azure-connection-string'
        // 'azure_container' => 'azure-container'
    ],

    'mail' => [
        'default' => [
            'transport' => 'smtp',             // How to send emails. Supports `smtp` and `sendmail`
            'from' => 'no-reply@example.com',  // The sender of the email

            // SMTP
            ////////////////////////////////////////
            'host' => 'smtp.example.com',
            'port' => 25,
            'username' => 'smtp-user',
            'password' => 'd1r3ctu5',
            'encryption' => 'tls'
        ],
    ],

    'cache' => [
        'enabled' => false,         // Cache all API responses
        'response_ttl' => 3600,     // Keep the cache for n seconds
        'pool' => [
            'adapter' => 'apc',     // What adapter to use to store the cache in
                                    // Supports: apc, apcu, filesystem, memcached,
                                    //           memcache, redis

            // Filesystem
            ////////////////////////////////////////
            // 'path' => '../cache/',

            // memcached, memcache, redis
            ////////////////////////////////////////
            // 'host' => 'localhost',
            // 'port' => 11211,
        ],
    ],

    'auth' => [
        'secret_key' => '1234',     // Used in the oAuth flow
        'public_key' => '9876',
        'social_providers' => [
            // 'okta' => [
            //     'client_id' => '',
            //     'client_secret' => '',
            //     'base_url' => 'https://dev-000000.oktapreview.com/oauth2/default'
            // ],
            // 'github' => [
            //     'client_id' => '',
            //     'client_secret' => ''
            // ],
            // 'facebook' => [
            //     'client_id'          => '',
            //     'client_secret'      => '',
            //     'graph_api_version'  => 'v2.8',
            // ],
            // 'google' => [
            //     'client_id'       => '',
            //     'client_secret'   => '',
            //     'hosted_domain'   => '*',
            //     'use_oidc_mode'   => true,
            // ],
            // 'twitter' => [
            //     'identifier'   => '',
            //     'secret'       => ''
            // ]
        ]
    ],

    'hooks' => [                    // https://docs.directus.io/extensions/hooks.html#creating-hooks
        'actions' => [],
        'filters' => [],
    ],

    'tableBlacklist' => [],         // What tables to globally ignore within Directus

    'env' => 'production',          // production, development, or staging
                                    // Production silences stack traces and error details in API output

    'logger' => [
        'path' => '../logs',       // Where to save warning and error logs for the API
    ],

    'feedback' => [
        'token' => '123',           // Not currently used
        'login' => true             // Not currently used
    ],
];
