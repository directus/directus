<?php

namespace ZendTest\Db\TestAsset;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\Delete;

class DeleteIgnore extends Delete
{
    const SPECIFICATION_DELETE = 'deleteIgnore';

    protected $specifications = [
        self::SPECIFICATION_DELETE => 'DELETE IGNORE FROM %1$s',
        self::SPECIFICATION_WHERE  => 'WHERE %1$s',
    ];

    protected function processdeleteIgnore(
        PlatformInterface $platform,
        DriverInterface $driver = null,
        ParameterContainer $parameterContainer = null
    ) {
        return parent::processDelete($platform, $driver, $parameterContainer);
    }
}
