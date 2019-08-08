<?php

namespace Directus\Config\Schema;

/**
 * Config schema
 */
class Schema {
    /**
     * Gets the configuration schema
     * @return Node
     */
    public static function get() {
        $isEnv = getenv("DIRECTUS_USE_ENV") === "1";
        if ($isEnv) {
            $loggerPath = "php://stdout";
        } else {
            $loggerPath = realpath(__DIR__ . '/../../../../../logs');
        }

        return new Group('directus', [
            new Group('app', [
                new Value('env', Types::STRING, 'production'),
                new Value('timezone', Types::STRING, 'America/New_York'),
            ]),
            new Group('settings', [
                new Group('logger', [
                    new Value('path', Types::STRING, $loggerPath),
                ])
            ]),
            new Group('database', [
                new Value('type', Types::STRING, 'mysql'),
                new Value('host', Types::STRING, 'localhost'),
                new Value('port', Types::INTEGER, 3306),
                new Value('name', Types::STRING, 'directus'),
                new Value('username', Types::STRING, 'root'),
                new Value('password', Types::STRING, 'root'),
                new Value('engine', Types::STRING, 'InnoDB'),
                new Value('chartset', Types::STRING, 'utf8mb4'),
                new Value('socket', Types::STRING, ''),
            ]),
            new Group('cache', [
                new Value('enabled', Types::BOOLEAN, false),
                new Value('response_ttl', Types::INTEGER, 3600),
                new Group('pool?', [
                    new Value('adapter', Types::STRING, 'filesystem'),
                    new Value('path', Types::STRING, '../cache/'),
                    new Value('host', Types::STRING, 'localhost'),
                    new Value('port', Types::INTEGER, 6379),
                ])
            ]),
            new Group('storage', [
                new Value('adapter', Types::STRING, 'local'),
                new Value('root', Types::STRING, 'public/uploads/_/originals'),
                new Value('root_url', Types::STRING, '/uploads/_/originals'),
                new Value('thumb_root', Types::STRING, 'public/uploads/_/thumbnails'),

                // S3
                new Value('key?', Types::STRING, 's3-key'),
                new Value('secret?', Types::STRING, 's3-secret'),
                new Value('region?', Types::STRING, 's3-region'),
                new Value('version?', Types::STRING, 's3-version'),
                new Value('bucket?', Types::STRING, 's3-bucket'),
                new Value('endpoint?', Types::STRING, 's3-endpoint'),
                new Group('options', [
                    new Value('ACL', Types::STRING, 'public-read'),
                    new Value('Cache-Control', Types::STRING, 'max-age=604800')
                ]),

                // TODO: Missing keys?
            ]),
            new Group('mail', [
                new Group('default', [
                    new Value('transport', Types::STRING, 'sendmail'),
                    new Value('from', Types::STRING, 'admin@example.com')
                ]),
            ]),
            new Group('cors', [
                new Value('enabled', Types::BOOLEAN, true),
                new Value('origin', Types::ARRAY, ['*']),
                new Value('methods', Types::ARRAY, [
                    'GET',
                    'POST',
                    'PUT',
                    'PATCH',
                    'DELETE',
                    'HEAD'
                ]),
                new Value('headers', Types::ARRAY, []),
                new Value('exposed_headers', Types::ARRAY, []),
                new Value('max_age', Types::INTEGER, null),
                new Value('credentials', Types::BOOLEAN, false),
            ]),
            new Group('rate_limit', [
                new Value('enabled', Types::BOOLEAN, false),
                new Value('limit', Types::INTEGER, 100),
                new Value('interval', Types::INTEGER, 60),
                new Value('adapter', Types::STRING, 'redis'),
                new Value('host', Types::STRING, '127.0.0.1'),
                new Value('port', Types::INTEGER, 6379),
                new Value('timeout', Types::INTEGER, 10),
            ]),
            new Group('hooks', [
                new Value('actions', Types::ARRAY, []),
                new Value('filters', Types::ARRAY, []),
            ]),
            new Group('feedback', [
                new Value('token', Types::STRING, 'a-kind-of-unique-token'),
                new Value('login', Types::STRING, true),
            ]),
            new Value('tableBlacklist', Types::ARRAY, []),
            new Group('auth', [
                new Value('secret_key', Types::STRING, '<type-a-secret-authentication-key-string>'),
                new Value('public_key', Types::STRING, '<type-a-public-authentication-key-string>'),
                new Group('social_providers', [
                    new Group('okta?', [
                        new Value('client_id', Types::STRING, ''),
                        new Value('client_secret', Types::STRING, ''),
                        new Value('base_url', Types::STRING, 'https://dev-000000.oktapreview.com/oauth2/default')
                    ]),
                    new Group('github?', [
                        new Value('client_id', Types::STRING, ''),
                        new Value('client_secret', Types::STRING, ''),
                    ]),
                    new Group('facebook?', [
                        new Value('client_id', Types::STRING, ''),
                        new Value('client_secret', Types::STRING, ''),
                        new Value('graph_api_version', Types::STRING, 'v2.8'),
                    ]),
                    new Group('google?', [
                        new Value('client_id', Types::STRING, ''),
                        new Value('client_secret', Types::STRING, ''),
                        new Value('hosted_domain', Types::STRING, '*'),
                        new Value('use_oidc_mode', Types::BOOLEAN, true),
                    ]),
                    new Group('twitter?', [
                        new Value('identifier', Types::STRING, ''),
                        new Value('secret', Types::STRING, ''),
                    ]),
                ]),
            ]),
            new Value('ext?', Types::ARRAY, []),
        ]);
    }
}
