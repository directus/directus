<?php

namespace Directus\Services;

use Directus\Application\Application;
use Directus\Database\SchemaManager;
use Directus\Permissions\Acl;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;

// @note: this is a temporary solution to implement services into Directus
abstract class AbstractService
{
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    /**
     * Gets application container
     *
     * @return \Slim\Helper\Set
     */
    protected function getContainer()
    {
        return $this->app->container;
    }

    /**
     * Gets application db connection instance
     *
     * @return \Zend\Db\Adapter\Adapter
     */
    protected function getConnection()
    {
        return $this->getContainer()->get('zenddb');
    }

    /**
     * Gets schema manager instance
     *
     * @return SchemaManager
     */
    public function getSchemaManager()
    {
        return $this->getContainer()->get('schemaManager');
    }

    /**
     * Gets Acl instance
     *
     * @return Acl
     */
    protected function getAcl()
    {
        return $this->getContainer()->get('acl');
    }

    protected function createTableGateway($name)
    {
        return new TableGateway($name, $this->getConnection(), $this->getAcl());
    }
}
