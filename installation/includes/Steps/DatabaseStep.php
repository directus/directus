<?php

namespace Directus\Installation\Steps;

use Directus\Db\Connection;
use Directus\Db\Schema;
use Directus\Util\Installation\InstallerUtils;

class DatabaseStep extends AbstractStep
{
    protected $number = 2;
    protected $name = 'database';
    protected $title = 'Database';
    protected $shortTitle = 'Database';
    protected $viewName = 'database.php';
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
        $this->dataContainer->set('db_types', Schema::getSupportedDatabases());
        $this->dataContainer->set('db_schemas', Schema::getTemplates());

        return null;
    }

    public function validate($data)
    {
        parent::validate($data);

        if (isset($data['db_type']) && !array_key_exists($data['db_type'], Schema::getSupportedDatabases())) {
            throw new \InvalidArgumentException("Database type '{$data['db_type']}' not supported.");
        }

        $dbConfig = array(
            'driver' => 'pdo_'.$data['db_type'],
            'host' => $data['db_host'],
            'port' => $data['db_port'],
            'database' => $data['db_name'],
            'username' => $data['db_user'],
            'password' => $data['db_password'],
            'charset' => 'utf8'
        );

        $connection = new Connection($dbConfig);
        $connection->connect();

        if ($connection->isStrictModeEnabled()) {
            $nextStep = install_get_step($this->getNumber()+1);
            $nextStep->getResponse()->addWarning('Strict mode is enabled.');
        }

        if (isset($data['db_schema']) && !InstallerUtils::schemaTemplateExists($data['db_schema'], BASE_PATH)) {
            throw new \InvalidArgumentException("Schema Template '{$data['db_schema']}' does not exits.");
        }
    }
}
