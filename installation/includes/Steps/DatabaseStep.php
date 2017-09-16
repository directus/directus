<?php

namespace Directus\Installation\Steps;

use Directus\Database\Connection;
use Directus\Database\SchemaManager;
use Directus\Database\Schemas\Sources\MySQLSchema;
use Directus\Util\Installation\InstallerUtils;

class DatabaseStep extends AbstractStep
{
    protected $number = 3;
    protected $name = 'database';
    protected $title = 'Database';
    protected $shortTitle = 'Database';
    protected $viewName = 'database.twig';
    protected $fields = [
        [
            'name' => 'db_type',
            'label' => 'DB Type',
            'rules' => 'required'
        ],
        [
            'name' => 'db_host',
            'label' => 'DB Host',
            'rules' => 'required'
        ],
        [
            'name' => 'db_port',
            'label' => 'DB Port',
            'rules' => 'required'
        ],
        [
            'name' => 'db_user',
            'label' => 'DB User',
            'rules' => 'required'
        ],
        [
            'name' => 'db_password',
            'label' => 'DB Password',
            'rules' => ''
        ],
        [
            'name' => 'db_name',
            'label' => 'DB Name',
            'rules' => 'required'
        ],
        [
            'name' => 'db_password',
            'label' => 'DB Password',
            'rules' => ''
        ],
        [
            'name' => 'db_schema',
            'label' => 'DB Schema',
            'rules' => ''
        ]
    ];

    /**
     * @var \PDO
     */
    protected $connection;

    public function preRun(&$state)
    {
        $this->dataContainer->set('db_types', SchemaManager::getSupportedDatabases());
        $this->dataContainer->set('db_schemas', SchemaManager::getTemplates());

        return null;
    }

    public function validate($data)
    {
        parent::validate($data);

        if (isset($data['db_type']) && !array_key_exists($data['db_type'], SchemaManager::getSupportedDatabases())) {
            throw new \InvalidArgumentException("Database type '{$data['db_type']}' not supported.");
        }

        $dbConfig = [
            'driver' => 'pdo_' . $data['db_type'],
            'host' => $data['db_host'],
            'port' => $data['db_port'],
            'database' => $data['db_name'],
            'username' => $data['db_user'],
            'password' => $data['db_password'],
            'charset' => 'utf8'
        ];

        $connection = new Connection($dbConfig);
        $connection->connect();

        // @FIXME: SchemaManager should accept a connection as parameter
        // it shouldn't be a static class no more.
        $schema = new MySQLSchema($connection);
        $schemaManager = new SchemaManager($schema);
        if ($schema->someTableExists($schemaManager->getCoreTables())) {
            throw new \InvalidArgumentException(__t('installation_core_table_exists'));
        }

        if (isset($data['db_schema']) && !empty($data['db_schema']) && !InstallerUtils::schemaTemplateExists($data['db_schema'], BASE_PATH)) {
            throw new \InvalidArgumentException(__t('schema_template_x_does_not_exists', [
                'template' => $data['db_schema']
            ]));
        }
    }
}
