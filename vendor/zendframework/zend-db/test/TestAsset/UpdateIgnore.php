<?php

namespace ZendTest\Db\TestAsset;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\Update;

class UpdateIgnore extends Update
{
    const SPECIFICATION_UPDATE = 'updateIgnore';

    protected $specifications = [
        self::SPECIFICATION_UPDATE => 'UPDATE IGNORE %1$s',
        self::SPECIFICATION_SET => 'SET %1$s',
        self::SPECIFICATION_WHERE  => 'WHERE %1$s',
    ];

    protected function processupdateIgnore(
        PlatformInterface $platform,
        DriverInterface $driver = null,
        ParameterContainer $parameterContainer = null
    ) {
        return parent::processUpdate($platform, $driver, $parameterContainer);
    }
}
