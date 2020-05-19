<?php

namespace Directus\Application;

use Cache\Adapter\Apc\ApcCachePool;
use Cache\Adapter\Apcu\ApcuCachePool;
use Cache\Adapter\Common\PhpCachePool;
use Cache\Adapter\Filesystem\FilesystemCachePool;
use Cache\Adapter\Memcached\MemcachedCachePool;
use Cache\Adapter\Memcache\MemcacheCachePool;
use Cache\Adapter\PHPArray\ArrayCachePool;
use Cache\Adapter\Redis\RedisCachePool;
use Cache\Adapter\Void\VoidCachePool;
use Cocur\Slugify\Slugify;
use Directus\Application\ErrorHandlers\ErrorHandler;
use function Directus\array_get;
use Directus\Authentication\Provider;
use Directus\Authentication\Sso\Social;
use Directus\Authentication\User\Provider\UserTableGatewayProvider;
use Directus\Cache\Response;
use Directus\Cache\Exception\InvalidCacheAdapterException;
use Directus\Cache\Exception\InvalidCacheConfigurationException;
use Directus\Config\StatusMapping;
use Directus\Database\Connection;
use Directus\Database\Exception\ConnectionFailedException;
use Directus\Database\Schema\DataTypes;
use Directus\Database\Schema\Object\Field;
use Directus\Database\Schema\SchemaFactory;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Database\TableGateway\DirectusPermissionsTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Database\SchemaService;
use Directus\Embed\EmbedManager;
use Directus\Exception\ForbiddenException;
use Directus\Exception\MissingStorageConfigurationException;
use Directus\Exception\RuntimeException;
use Directus\Filesystem\Files;
use Directus\Filesystem\Filesystem;
use Directus\Filesystem\FilesystemFactory;
use function Directus\generate_uuid4;
use function Directus\get_api_project_from_request;
use function Directus\get_directus_files_settings;
use function Directus\get_directus_setting;
use function Directus\get_url;
use Directus\Hash\HashManager;
use Directus\Hook\Emitter;
use Directus\Hook\Payload;
use function Directus\is_a_url;
use function Directus\is_iso8601_datetime;
use Directus\Logger\Exception\InvalidLoggerConfigurationException;
use Directus\Mail\Mailer;
use Directus\Mail\TransportManager;
use Directus\Mail\Transports\SendMailTransport;
use Directus\Mail\Transports\SmtpTransport;
use function Directus\normalize_exception;
use Directus\Permissions\Acl;
use Directus\Services\AuthService;
use Directus\Session\Session;
use Directus\Session\Storage\NativeSessionStorage;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Util\Installation\InstallerUtils;
use Directus\Util\StringUtils;
use League\Flysystem\Adapter\Local;
use Monolog\Formatter\LineFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Slim\Views\Twig;
use Zend\Db\TableGateway\TableGateway;
use Directus\Api\Routes\Roles;
use function Directus\get_random_string;

class CoreServicesProvider
{
    public function register($container)
    {
        $container['database'] = $this->getDatabase();
        $container['logger'] = $this->getLogger();
        // TODO: Put hooks/filters listeners out of this service
        // for easy access and code readability
        $container['hook_emitter'] = $this->getEmitter();
        $container['auth'] = $this->getAuth();
        $container['external_auth'] = $this->getExternalAuth();
        $container['session'] = $this->getSession();
        $container['slugify'] = $this->getSlugify();
        $container['acl'] = $this->getAcl();
        $container['errorHandler'] = $this->getErrorHandler();
        $container['phpErrorHandler'] = $this->getErrorHandler();
        $container['schema_adapter'] = $this->getSchemaAdapter();
        $container['schema_manager'] = $this->getSchemaManager();
        $container['schema_factory'] = $this->getSchemaFactory();
        $container['hash_manager'] = $this->getHashManager();
        $container['embed_manager'] = $this->getEmbedManager();
        $container['filesystem'] = $this->getFileSystem();
        $container['filesystem_thumb'] = $this->getThumbFilesystem();
        $container['files'] = $this->getFiles();
        $container['files_thumb'] = $this->getThumbFiles();
        $container['mailer_transport'] = $this->getMailerTransportManager();
        $container['mailer'] = $this->getMailer();
        $container['mail_view'] = $this->getMailView();
        $container['app_settings'] = $this->getSettings();
        $container['status_mapping'] = $this->getStatusMapping();

        // Move this separately to avoid clogging one class
        $container['cache'] = $this->getCache();
        $container['response_cache'] = $this->getResponseCache();

        $container['services'] = $this->getServices($container);
    }

    /**
     * @return \Closure
     */
    protected function getLogger()
    {
        /**
         * @param Container $container
         * @return Logger
         */
        $logger = function ($container) {
            $logger = new Logger(sprintf('api[%s]', get_api_project_from_request()));
            $formatter = new LineFormatter();
            $formatter->allowInlineLineBreaks();
            $formatter->includeStacktraces();
            // TODO: Move log configuration outside "slim app" settings
            $path = $container->get('path_base') . '/logs';
            $config = $container->get('config');
            if ($config->has('logger.path')) {
                $path = $config->get('logger.path');
            }

            $pathIsStream = $path == 'php://stdout' || $path == 'php://stderr';
            if (!$pathIsStream) {
                if (file_exists($path)) {
                    if (is_file($path)) {
                        $path = dirname($path);
                    }
                } else {
                    mkdir($path, 0777, true);
                }

                if (!is_dir($path) || !is_writeable($path)) {
                    throw new InvalidLoggerConfigurationException('path');
                }

                if (substr($path, -1) == '/') {
                    $path = substr($path, 0, strlen($path) - 1);
                }
            }

            $filenameFormat = '%s.%s.log';
            foreach (Logger::getLevels() as $name => $level) {
                if ($pathIsStream) {
                    $loggerPath = $path;
                } else {
                    $loggerPath = $path . '/' . sprintf($filenameFormat, strtolower($name), date('Y-m-d'));
                }
                $handler = new StreamHandler(
                    $loggerPath,
                    $level,
                    false
                );
                $handler->setFormatter($formatter);
                $logger->pushHandler($handler);
            }

            return $logger;
        };

        return $logger;
    }

    /**
     * @return \Closure
     */
    protected function getErrorHandler()
    {
        /**
         * @param Container $container
         *
         * @return ErrorHandler
         */
        $errorHandler = function (Container $container) {
            $hookEmitter = $container['hook_emitter'];

            return new ErrorHandler($hookEmitter, [
                'env' => $container->get('config')->get('env', 'development')
            ]);
        };

        return $errorHandler;
    }

    /**
     * @return \Closure
     */
    protected function getEmitter()
    {
        return function (Container $container) {
            $emitter = new Emitter();
            $cachePool = $container->get('cache');

            // Cache subscriptions
            $emitter->addAction('postUpdate', function (RelationalTableGateway $gateway, $data) use ($cachePool) {
                if (isset($data[$gateway->primaryKeyFieldName])) {
                    $cachePool->invalidateTags(['entity_' . $gateway->getTable() . '_' . $data[$gateway->primaryKeyFieldName]]);
                }
            });

            $cacheTableTagInvalidator = function ($tableName) use ($cachePool) {
                $cachePool->invalidateTags(['table_' . $tableName]);
            };
            foreach (['item.create:after', 'item.delete:after', 'item.update:after', 'collection.update:after', 'collection.delete:after'] as $action) {
                $emitter->addAction($action, $cacheTableTagInvalidator);
            }

            $emitter->addAction('item.update.directus_permissions:after', function ($data) use ($container, $cachePool) {
                $acl = $container->get('acl');
                $dbConnection = $container->get('database');
                $privileges = new DirectusPermissionsTableGateway($dbConnection, $acl);
                $record = $privileges->fetchById($data['id']);
                $cachePool->invalidateTags(['permissions_collection_' . $record['collection']]);
            });
            // /Cache subscriptions

            $emitter->addAction('application.error', function ($e) use ($container) {
                /** @var Logger $logger */
                $logger = $container->get('logger');

                $logger->error(normalize_exception($e));
            });
            $emitter->addFilter('response', function (Payload $payload) use ($container) {
                /** @var Acl $acl */
                $acl = $container->get('acl');
                if ($acl->isPublic() || !$acl->getUserId()) {
                    $payload->set('public', true);
                }
                return $payload;
            });
            $emitter->addAction('item.create.directus_roles', function ($data) use ($container) {
                $acl = $container->get('acl');
                $zendDb = $container->get('database');
                $privilegesTable = new DirectusPermissionsTableGateway($zendDb, $acl);

                $defaultPermissions = InstallerUtils::getDefaultPermissions();

                foreach ($defaultPermissions as $collection => $permissions) {
                    if (!ArrayUtils::isNumericKeys($permissions)) {
                        $permissions = [$permissions];
                    }

                    foreach ($permissions as $permission) {
                        $privilegesTable->insertPrivilege(array_merge($permission, [
                            'role' => $data['id'],
                            'collection' => $collection
                        ]));
                    }
                }
            });
            $emitter->addFilter('item.create:before', function (Payload $payload) use ($container) {
                $collectionName = $payload->attribute('collection_name');
                $collection = SchemaService::getCollection($collectionName);
                /** @var Acl $acl */
                $acl = $container->get('acl');


                if ($dateCreated = $collection->getDateCreatedField()) {
                    $payload[$dateCreated->getName()] = DateTimeUtils::nowInUTC()->toString();
                }

                if ($dateModified = $collection->getDateModifiedField()) {
                    $payload[$dateModified->getName()] = DateTimeUtils::nowInUTC()->toString();
                }

                // Directus Users created user are themselves (primary key)
                // populating that field will be a duplicated primary key violation
                if ($collection->getName() === 'directus_users') {
                    return $payload;
                }

                $userCreated = $collection->getUserCreatedField();
                $userModified = $collection->getUserModifiedField();

                if ($userCreated) {
                    $payload[$userCreated->getName()] = $acl->getUserId();
                }

                if ($userModified) {
                    $payload[$userModified->getName()] = $acl->getUserId();
                }

                return $payload;
            }, Emitter::P_HIGH);

            $emitter->addFilter('item.update:before', function (Payload $payload) use ($container) {
                $collection = SchemaService::getCollection($payload->attribute('collection_name'));

                /** @var Acl $acl */
                $acl = $container->get('acl');
                if ($dateModified = $collection->getDateModifiedField()) {
                    $payload[$dateModified->getName()] = DateTimeUtils::nowInUTC()->toString();
                }

                if ($userModified = $collection->getUserModifiedField()) {
                    $payload[$userModified->getName()] = $acl->getUserId();
                }

                // NOTE: exclude date_uploaded from updating a file record
                if ($collection->getName() === 'directus_files') {
                    $payload->remove('date_uploaded');
                }

                return $payload;
            }, Emitter::P_HIGH);

            $addFilesUrl = function ($rows) {
                return \Directus\append_storage_information($rows);
            };
            $emitter->addFilter('item.read.directus_files:before', function (Payload $payload) {
                $columns = $payload->get('columns');
                if (!in_array('filename_disk', $columns)) {
                    $columns[] = 'filename_disk';
                    $payload->set('columns', $columns);
                }
                if (!in_array('filename_download', $columns)) {
                    $columns[] = 'filename_download';
                    $payload->set('columns', $columns);
                }
                return $payload;
            });

            // -- Data types -----------------------------------------------------------------------------
            // TODO: improve Parse boolean/json/array almost similar code
            $parseArray = function ($decode, $collection, $data) use ($container) {
                /** @var SchemaManager $schemaManager */
                $schemaManager = $container->get('schema_manager');
                $collectionObject = $schemaManager->getCollection($collection);

                foreach ($collectionObject->getFields(array_keys($data)) as $field) {
                    if (!DataTypes::isArray($field->getType())) {
                        continue;
                    }

                    $key = $field->getName();
                    $value = $data[$key];

                    // convert string to array
                    $decodeFn = function ($value) {
                        // if empty string, empty array, null or false
                        if (empty($value) && !is_numeric($value)) {
                            $value = [];
                        } else {
                            $value = !is_array($value) ? explode(',', $value) : $value;
                        }

                        return $value;
                    };

                    // convert array into string
                    $encodeFn = function ($value) {
                        return is_array($value) ? implode(',', $value) : $value;
                    };

                    // NOTE: If the array has value with comma it will be treat as a separate value
                    // should we encode the commas to "hide" the comma when splitting the values?
                    if ($decode) {
                        $value = $decodeFn($value);
                    } else {
                        $value = $encodeFn($value);
                    }

                    $data[$key] = $value;
                }

                return $data;
            };

            $parseBoolean = function ($collection, $data) use ($container) {
                /** @var SchemaManager $schemaManager */
                $schemaManager = $container->get('schema_manager');
                $collectionObject = $schemaManager->getCollection($collection);

                foreach ($collectionObject->getFields(array_keys($data)) as $field) {
                    if (!DataTypes::isBoolean($field->getType())) {
                        continue;
                    }

                    $key = $field->getName();
                    $data[$key] = boolval($data[$key]);
                }

                return $data;
            };
            $parseJson = function ($decode, $collection, $data) use ($container) {
                /** @var SchemaManager $schemaManager */
                $schemaManager = $container->get('schema_manager');
                $collectionObject = $schemaManager->getCollection($collection);

                foreach ($collectionObject->getFields(array_keys($data)) as $field) {
                    if (!DataTypes::isJson($field->getType())) {
                        continue;
                    }

                    $key = $field->getName();
                    $value = $data[$key];

                    if ($decode === true) {
                        $value = is_string($value) ? json_decode($value) : $value;
                    } elseif ($value !== null) {
                        $value = !is_string($value) ? json_encode($value) : $value;
                    }

                    $data[$key] = $value;
                }

                return $data;
            };

            $emitter->addFilter('item.create:before', function (Payload $payload) use ($parseJson, $parseArray) {
                $payload->replace(
                    $parseJson(
                        false,
                        $payload->attribute('collection_name'),
                        $payload->getData()
                    )
                );

                $payload->replace($parseArray(false, $payload->attribute('collection_name'), $payload->getData()));

                return $payload;
            });
            $emitter->addFilter('item.update:before', function (Payload $payload) use ($parseJson, $parseArray) {
                $payload->replace(
                    $parseJson(
                        false,
                        $payload->attribute('collection_name'),
                        $payload->getData()
                    )
                );
                $payload->replace(
                    $parseArray(
                        false,
                        $payload->attribute('collection_name'),
                        $payload->getData()
                    )
                );

                return $payload;
            });
            $emitter->addFilter('item.read', function (Payload $payload) use ($container, $parseJson, $parseArray, $parseBoolean) {
                $rows = $payload->getData();
                $collectionName = $payload->attribute('collection_name');
                /** @var SchemaManager $schemaManager */
                $schemaManager = $container->get('schema_manager');
                $collection = $schemaManager->getCollection($collectionName);

                $hasJsonField = $collection->hasJsonField();
                $hasBooleanField = $collection->hasBooleanField();
                $hasArrayField = $collection->hasArrayField();

                if (!$hasArrayField && !$hasBooleanField && !$hasJsonField) {
                    return $payload;
                }

                foreach ($rows as $key => $row) {
                    if ($hasJsonField) {
                        $row = $parseJson(true, $collectionName, $row);
                    }

                    if ($hasBooleanField) {
                        $row = $parseBoolean($collectionName, $row);
                    }

                    if ($hasArrayField) {
                        $row = $parseArray(true, $collectionName, $row);
                    }

                    $rows[$key] = $row;
                }

                $payload->replace($rows);

                return $payload;
            });
            // -------------------------------------------------------------------------------------------
            // Add file url and thumb url
            $emitter->addFilter('item.read.directus_files', function (Payload $payload) use ($addFilesUrl, $container) {

                $rows = $addFilesUrl($payload->getData());
                $payload->replace($rows);

                return $payload;
            });
            $emitter->addFilter('item.read.directus_users', function (Payload $payload) use ($container) {
                $acl = $container->get('acl');
                $rows = $payload->getData();
                $userId = $acl->getUserId();
                foreach ($rows as &$row) {
                    $omit = [
                        'password'
                    ];
                    // Authenticated user can see their private info
                    // Admin can see all users private info
                    if (!$acl->isAdmin() && $userId !== (int) $row['id']) {
                        $omit = array_merge($omit, [
                            'token',
                            'email_notifications',
                            'last_access_on',
                            'last_page'
                        ]);
                    }
                    $row = ArrayUtils::omit($row, $omit);
                }
                $payload->replace($rows);
                return $payload;
            });

            $onInsertOrUpdate = function (Payload $payload) use ($container) {
                /** @var SchemaManager $schemaManager */
                $schemaManager = $container->get('schema_manager');
                /** @var HashManager $hashManager */
                $hashManager = $container->get('hash_manager');
                $collectionName = $payload->attribute('collection_name');
                $collection = $schemaManager->getCollection($collectionName);
                $isSystemCollection = $schemaManager->isSystemCollection($collectionName);
                /** @var Field[] $slugMirrorFields */
                $slugMirrorFields = [];

                // Find all slug field mirroredField values
                foreach ($collection->getFields() as $field) {
                    if (!$field || !DataTypes::isSlugType($field->getType())) {
                        continue;
                    }

                    $fieldOptions = $options = $field->getOptions() ?: [];
                    $mirroredFieldName = ArrayUtils::get($fieldOptions, 'mirroredField');
                    if ($mirroredFieldName && ($mirroredField = $collection->getField($mirroredFieldName)) && DataTypes::isStringType($mirroredField->getType())) {
                        $slugMirrorFields[$mirroredFieldName] = $field;
                    }
                }

                // TODO: Use iterator instead of looping through a copy of the payload data (while ($payload->valid))
                $data = $payload->getData();
                foreach ($data as $key => $value) {
                    $field = $collection->getField($key);

                    // This value is being populated in another hook
                    if (!$field || DataTypes::isSystemDateTimeType($field->getType())) {
                        continue;
                    }

                    $type = $field->getType();
                    if (DataTypes::isHashType($type)) {
                        $options = $field->getOptions() ?: ['hasher' => 'core'];
                        $hashedString = $hashManager->hash($value, $options);
                        $payload->set($key, $hashedString);

                        continue;
                    }

                    if (array_key_exists($key, $slugMirrorFields) && !$payload->has($slugMirrorFields[$key]->getName())) {
                        /** @var Slugify $slugify */
                        $slugify = $container->get('slugify');

                        $slugField = $slugMirrorFields[$key];
                        $slugOptions = $slugField->getOptions() ?: [];

                        ArrayUtils::renameSome($slugOptions, [
                            'forceLowercase' => 'lowercase',
                        ]);

                        $slugOptions = ArrayUtils::defaults(['lowercase' => true], $slugOptions);

                        $payload->set($slugField->getName(), $slugify->slugify($value, $slugOptions));

                        continue;
                    }

                    // Skip if the date/time is empty
                    if (!$value) {
                        continue;
                    }

                    if (DataTypes::isDateTimeType($type)) {
                        $dateTime = new DateTimeUtils($value);
                        if ($isSystemCollection || is_iso8601_datetime($value)) {
                            $dateTimeValue = $dateTime->toUTCString();
                        } else {
                            $dateTimeValue = $dateTime->toString();
                        }

                        $payload->set($key, $dateTimeValue);
                    } elseif (DataTypes::isDateType($type)) {
                        $dateTime = new DateTimeUtils($value);
                        $payload->set($key, $dateTime->toString(DateTimeUtils::DEFAULT_DATE_FORMAT));
                    } elseif (DataTypes::isTimeType($type)) {
                        $dateTime = new DateTimeUtils($value);
                        $payload->set($key, $dateTime->toString(DateTimeUtils::DEFAULT_TIME_FORMAT));
                    }
                }

                return $payload;
            };

            $generateExternalId = function (Payload $payload) {
                // generate an external id if none is passed
                if (!$payload->get('external_id')) {
                    $payload->set('external_id', generate_uuid4());
                }

                return $payload;
            };
            $emitter->addFilter('item.create.directus_users:before', $generateExternalId);
            $emitter->addFilter('item.create.directus_roles:before', $generateExternalId);

            $emitter->addFilter('item.create:before', $onInsertOrUpdate);
            $emitter->addFilter('item.update:before', $onInsertOrUpdate);

            $beforeSavingFiles = function ($payload) use ($container) {
                $acl = $container->get('acl');
                if (!$acl->canCreate('directus_files')) {
                    throw new ForbiddenException('You are not allowed to upload files');
                }

                return $payload;
            };
            $beforeUpdatingFiles = function ($payload) use ($container) {
                $acl = $container->get('acl');
                if (!$acl->canUpdate('directus_files')) {
                    throw new ForbiddenException('You are not allowed to edit files');
                }

                return $payload;
            };
            $beforeDeletingFiles = function ($payload) use ($container) {
                $acl = $container->get('acl');
                if (!$acl->canDelete('directus_files')) {
                    throw new ForbiddenException('You are not allowed to delete files');
                }

                return $payload;
            };
            $emitter->addAction('file.save', $beforeSavingFiles);
            $emitter->addAction('file.update', $beforeUpdatingFiles);
            // TODO: Make insert actions and filters
            $emitter->addFilter('item.create.directus_files:before', $beforeSavingFiles);
            $emitter->addFilter('item.update.directus_files:before', $beforeUpdatingFiles);
            $emitter->addFilter('item.delete.directus_files:before', $beforeDeletingFiles);

            $emitter->addAction('auth.request:credentials', function () use ($container) {
                /** @var Session $session */
                $session = $container->get('session');
                $useTelemetry =  get_directus_setting('telemetry', true);

                if ($useTelemetry) {
                    if ($session->getStorage()->get('telemetry') === true) {
                        return;
                    }

                    $data = [
                        'version' => Application::DIRECTUS_VERSION,
                        'url' => get_url(),
                        'type' => 'api'
                    ];
                    \Directus\request_send_json('POST', 'https://telemetry.directus.io/count', $data);

                    // NOTE: this only works when the client sends subsequent request with the same cookie
                    $session->getStorage()->set('telemetry', true);
                }
            });

            return $emitter;
        };
    }

    /**
     * @return \Closure
     */
    protected function getDatabase()
    {
        return function (Container $container) {
            $config = $container->get('config');
            $dbConfig = $config->get('database');
            $defaultConfig = [];

            // TODO: enforce/check required params

            $charset = ArrayUtils::get($dbConfig, 'charset', 'utf8mb4');
            $type = ArrayUtils::pull($dbConfig, 'type');

            // the "database" attribute is named "name"
            // and the "unix_socket" is named "socket"
            // in the directus configuration
            ArrayUtils::renameSome($dbConfig, [
                'name' => 'database',
                'socket' => 'unix_socket',
            ]);

            if (strtolower($type) === 'mysql') {
                $defaultConfig = [
                    \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                    \PDO::MYSQL_ATTR_INIT_COMMAND => sprintf('SET NAMES "%s"', $charset)
                ];
            }

            $parameters = array_merge($defaultConfig, $dbConfig, [
                'driver' => $type ? 'Pdo_' . $type : null,
                'charset' => $charset
            ]);

            if (!ArrayUtils::get($parameters, 'unix_socket')) {
                ArrayUtils::remove($parameters, 'unix_socket');
            } else {
                ArrayUtils::remove($parameters, 'host');
            }

            try {
                $db = new Connection($parameters);
                $db->connect();
            } catch (\Exception $e) {
                throw new ConnectionFailedException($e);
            }

            return $db;
        };
    }

    /**
     * @return \Closure
     */
    protected function getAuth()
    {
        return function (Container $container) {
            $db = $container->get('database');

            return new Provider(
                new UserTableGatewayProvider(
                    new DirectusUsersTableGateway($db)
                ),
                [
                    'secret_key' => $container->get('config')->get('auth.secret_key'),
                    'public_key' => $container->get('config')->get('auth.public_key'),
                    'ttl' => $container->get('config')->get('auth.ttl'),
                ]
            );
        };
    }

    /**
     * @return \Closure
     */
    protected function getExternalAuth()
    {
        return function (Container $container) {
            $config = $container->get('config');
            $providersConfig = $config->get('auth.social_providers', []);

            $socialAuth = new Social();

            $coreSso = \Directus\get_custom_x('auth', 'public/extensions/core/auth', true);
            $customSso = \Directus\get_custom_x('auth', 'public/extensions/custom/auth', true);

            // Flag the customs providers in order to choose the correct path for the icons
            $customSso = array_map(function ($config) {
                $config['custom'] = true;

                return $config;
            }, $customSso);

            $ssoProviders = array_merge($coreSso, $customSso);
            foreach ($providersConfig as $providerName => $providerConfig) {
                if (!is_array($providerConfig)) {
                    continue;
                }

                if (ArrayUtils::get($providerConfig, 'enabled') === false) {
                    continue;
                }

                if (array_key_exists($providerName, $ssoProviders) && isset($ssoProviders[$providerName]['provider'])) {
                    $providerInfo = $ssoProviders[$providerName];
                    $class = array_get($providerInfo, 'provider');
                    $custom = array_get($providerInfo, 'custom');

                    if (!class_exists($class)) {
                        throw new RuntimeException(sprintf('Class %s not found', $class));
                    }

                    $socialAuth->register($providerName, new $class($container, array_merge([
                        'custom' => $custom,
                        'callback_url' => \Directus\get_url('/' . get_api_project_from_request() . '/auth/sso/' . $providerName . '/callback')
                    ], $providerConfig)));
                }
            }

            return $socialAuth;
        };
    }

    /**
     * @return \Closure
     */
    protected function getSession()
    {
        return function (Container $container) {
            $config = $container->get('config');

            $session = new Session(new NativeSessionStorage($config->get('session', [])));
            $session->getStorage()->start();

            return $session;
        };
    }

    /**
     * @return \Closure
     */
    protected function getSlugify()
    {
        return function () {
            return new Slugify();
        };
    }

    /**
     * @return \Closure
     */
    protected function getAcl()
    {
        return function (Container $container) {
            return new Acl();
        };
    }

    /**
     * @return \Closure
     */
    protected function getCache()
    {
        return function (Container $container) {
            $config = $container->get('config');
            $poolConfig = $config->get('cache.pool');

            if (!$poolConfig || (!is_object($poolConfig) && empty($poolConfig['adapter']))) {
                $poolConfig = ['adapter' => 'void'];
            }

            $pool = new VoidCachePool();

            if (!$config->get('cache.enabled'))
                return $pool;

            if (is_object($poolConfig) && $poolConfig instanceof PhpCachePool) {
                $pool = $poolConfig;
            } else {
                if (!in_array($poolConfig['adapter'], ['apc', 'apcu', 'array', 'filesystem', 'memcached', 'memcache', 'redis', 'rediscluster', 'void'])) {
                    throw new InvalidCacheAdapterException();
                }

                $adapter = $poolConfig['adapter'];

                if ($adapter == 'apc') {
                    $pool = new ApcCachePool();
                }

                if ($adapter == 'apcu') {
                    $pool = new ApcuCachePool();
                }

                if ($adapter == 'array') {
                    $pool = new ArrayCachePool();
                }

                if ($adapter == 'filesystem') {
                    if (empty($poolConfig['path']) || !is_string($poolConfig['path'])) {
                        throw new InvalidCacheConfigurationException($adapter);
                    }

                    $cachePath = $poolConfig['path'];
                    if ($cachePath[0] !== '/') {
                        $basePath = $container->get('path_base');
                        $cachePath = rtrim($basePath, '/') . '/' . $cachePath;
                    }

                    $filesystemAdapter = new Local($cachePath);
                    $filesystem = new \League\Flysystem\Filesystem($filesystemAdapter);

                    $pool = new FilesystemCachePool($filesystem);
                }

                if ($adapter == 'memcached' || $adapter == 'memcache') {

                    if ($adapter == 'memcached' && !extension_loaded('memcached')) {
                        throw new InvalidCacheConfigurationException($adapter);
                    }

                    if ($adapter == 'memcache' && !extension_loaded('memcache')) {
                        throw new InvalidCacheConfigurationException($adapter);
                    }

                    $client = $adapter == 'memcached' ? new \Memcached() : new \Memcache();
                    if (isset($poolConfig['url'])) {
                        $urls = explode(';', $poolConfig['url']);
                        if ($urls ===  false) {
                            $urls = 'localhost:11211';
                        }
                        foreach ($urls as $url) {
                            $parts = parse_url($url);
                            $host = (isset($parts['host'])) ? $parts['host'] : 'localhost';
                            $port = (isset($parts['port'])) ? $parts['port'] : 11211;

                            $client->addServer($host, $port);
                        }
                    } else {
                        $host = (isset($poolConfig['host'])) ? $poolConfig['host'] : 'localhost';
                        $port = (isset($poolConfig['port'])) ? $poolConfig['port'] : 11211;

                        $client->addServer($host, $port);
                    }
                    $pool = $adapter == 'memcached' ? new MemcachedCachePool($client) : new MemcacheCachePool($client);
                }

                if ($adapter == 'redis' || $adapter == 'rediscluster') {

                    if (!extension_loaded('redis')) {
                        throw new InvalidCacheConfigurationException($adapter);
                    }

                    $host = (isset($poolConfig['host'])) ? $poolConfig['host'] : 'localhost';
                    $port = (isset($poolConfig['port'])) ? $poolConfig['port'] : 6379;
                    $socket = (isset($poolConfig['socket'])) ? $poolConfig['socket'] : null;
                    $auth = (isset($poolConfig['auth'])) ? $poolConfig['auth'] : null;

                    if ($adapter == 'rediscluster') {
                        $client = new \RedisCluster(NULL, ["$host:$port"]);
                    } else {
                        $client = new \Redis();
                        if ($socket) {
                            $client->connect($socket);
                        } else {
                            $client->connect($host, $port);
                        }
                    }

                    if ($auth) {
                        $client->auth($auth);
                    }

                    $pool = new RedisCachePool($client);
                }
            }

            return $pool;
        };
    }

    /**
     * @return \Closure
     */
    protected function getSchemaAdapter()
    {
        return function (Container $container) {
            $adapter = $container->get('database');
            $databaseName = $adapter->getPlatform()->getName();

            switch ($databaseName) {
                case 'MySQL':
                    return new \Directus\Database\Schema\Sources\MySQLSchema($adapter);
                    // case 'SQLServer':
                    //    return new SQLServerSchema($adapter);
                    // case 'SQLite':
                    //     return new \Directus\Database\Schemas\Sources\SQLiteSchema($adapter);
                    // case 'PostgreSQL':
                    //     return new PostgresSchema($adapter);
            }

            throw new \Exception('Unknown/Unsupported database: ' . $databaseName);
        };
    }

    /**
     * @return \Closure
     */
    protected function getSchemaManager()
    {
        return function (Container $container) {
            return new SchemaManager(
                $container->get('schema_adapter')
            );
        };
    }

    /**
     * @return \Closure
     */
    protected function getSchemaFactory()
    {
        return function (Container $container) {
            return new SchemaFactory(
                $container->get('schema_manager')
            );
        };
    }

    /**
     * @return \Closure
     */
    protected function getResponseCache()
    {
        return function (Container $container) {
            return new Response($container->get('cache'), $container->get('config')->get('cache.response_ttl'));
        };
    }

    /**
     * @return \Closure
     */
    protected function getHashManager()
    {
        return function (Container $container) {
            $hashManager = new HashManager();
            $basePath = $container->get('path_base');

            $path = implode(DIRECTORY_SEPARATOR, [
                $basePath,
                'custom',
                'hashers',
                '*.php'
            ]);

            $customHashersFiles = glob($path);
            $hashers = [];

            if ($customHashersFiles) {
                foreach ($customHashersFiles as $filename) {
                    $name = basename($filename, '.php');
                    // filename starting with underscore are skipped
                    if (StringUtils::startsWith($name, '_')) {
                        continue;
                    }

                    $hashers[] = '\\Directus\\Custom\\Hasher\\' . $name;
                }
            }

            foreach ($hashers as $hasher) {
                $hashManager->register(new $hasher());
            }

            return $hashManager;
        };
    }

    protected function getFileSystem()
    {
        return function (Container $container) {
            return new Filesystem(
                FilesystemFactory::createAdapter($this->getStorageConfiguration($container), 'root')
            );
        };
    }

    /**
     * @return \Closure
     */
    protected function getThumbFilesystem()
    {
        return function (Container $container) {
            return new Filesystem(
                FilesystemFactory::createAdapter($this->getStorageConfiguration($container), 'thumb_root')
            );
        };
    }

    /**
     * @return \Closure
     */
    protected function getMailerTransportManager()
    {
        return function (Container $container) {
            $config = $container->get('config');
            $manager = new TransportManager();

            $transports = [
                'smtp' => SmtpTransport::class,
                'sendmail' => SendMailTransport::class,
            ];

            $mailConfigs = $config->get('mail');
            foreach ($mailConfigs as $name => $mailConfig) {
                $transport = ArrayUtils::get($mailConfig, 'transport');

                if (array_key_exists($transport, $transports)) {
                    $transport = $transports[$transport];
                }

                $manager->register($name, $transport, $mailConfig);
            }

            return $manager;
        };
    }

    /**
     * @return \Closure
     */
    protected function getMailer()
    {
        return function (Container $container) {
            return new Mailer($container->get('mailer_transport'));
        };
    }

    /**
     * @return \Closure
     */
    protected function getSettings()
    {
        return function (Container $container) {
            $dbConnection = $container->get('database');
            $settingsTable = new TableGateway(SchemaManager::COLLECTION_SETTINGS, $dbConnection);

            return $settingsTable->select()->toArray();
        };
    }

    /**
     * @return \Closure
     */
    protected function getStatusMapping()
    {
        return function (Container $container) {
            $statusMapping = get_directus_setting('status_mapping');

            if (is_string($statusMapping)) {
                $statusMapping = json_decode($statusMapping, true);
            }

            if (!is_array($statusMapping)) {
                $statusMapping = [];
            }

            return new StatusMapping($statusMapping);
        };
    }

    /**
     * @return \Closure
     */
    protected function getMailView()
    {
        return function (Container $container) {
            $basePath = $container->get('path_base');

            return new Twig([
                $basePath . '/public/extensions/custom/mail',
                $basePath . '/src/mail'
            ]);
        };
    }

    /**
     * @return \Closure
     */
    protected function getFiles()
    {
        return function (Container $container) {
            // Convert result into a key-value array
            $filesSettings = get_directus_files_settings();

            $filesystem = $container->get('filesystem');
            $config = $container->get('config');
            $config = $config->get('storage', []);
            $emitter = $container->get('hook_emitter');

            return new Files(
                $filesystem,
                $config,
                $filesSettings,
                $emitter
            );
        };
    }

    /**
     * @return \Closure
     */
    protected function getThumbFiles()
    {
        return function (Container $container) {
            // Convert result into a key-value array
            $filesSettings = get_directus_files_settings();

            $filesystem = $container->get('filesystem_thumb');
            $config = $container->get('config');
            $config = $config->get('storage', []);
            $emitter = $container->get('hook_emitter');

            return new Files(
                $filesystem,
                $config,
                $filesSettings,
                $emitter
            );
        };
    }

    protected function getEmbedManager()
    {
        return function (Container $container) {
            $app = Application::getInstance();
            $embedManager = new EmbedManager();

            // Fetch files settings
            try {
                $settings = get_directus_files_settings();
            } catch (\Exception $e) {
                $settings = [];
                /** @var Logger $logger */
                $logger = $container->get('logger');
                $logger->warning($e->getMessage());
            }

            $providers = [
                '\Directus\Embed\Provider\VimeoProvider',
                '\Directus\Embed\Provider\YoutubeProvider'
            ];

            $path = implode(DIRECTORY_SEPARATOR, [
                $app->getContainer()->get('path_base'),
                'custom',
                'embeds',
                '*.php'
            ]);

            $customProvidersFiles = glob($path);
            if ($customProvidersFiles) {
                foreach ($customProvidersFiles as $filename) {
                    $providers[] = '\\Directus\\Embed\\Provider\\' . basename($filename, '.php');
                }
            }

            foreach ($providers as $providerClass) {
                $provider = new $providerClass($settings);
                $embedManager->register($provider);
            }

            return $embedManager;
        };
    }

    /**
     * Register all services
     *
     * @param Container $mainContainer
     *
     * @return \Closure
     *
     * @internal param Container $container
     *
     */
    protected function getServices(Container $mainContainer)
    {
        // A services container of all Directus services classes
        return function () use ($mainContainer) {
            $container = new Container();

            // =============================================================================
            // Register all services
            // -----------------------------------------------------------------------------
            // TODO: Set a place to load all the services
            // =============================================================================
            $container['auth'] = $this->getAuthService($mainContainer);

            return $container;
        };
    }

    /**
     * @param Container $container Application container
     *
     * @return \Closure
     */
    protected function getAuthService(Container $container)
    {
        return function () use ($container) {
            return new AuthService($container);
        };
    }

    /**
     * @param Container $container
     *
     * @return array
     *
     * @throws MissingStorageConfigurationException
     */
    protected function getStorageConfiguration(Container $container)
    {
        $config = $container->get('config');
        $storageConfig = $config->get('storage');

        if (!$storageConfig) {
            throw new MissingStorageConfigurationException();
        }

        return $storageConfig;
    }
}
