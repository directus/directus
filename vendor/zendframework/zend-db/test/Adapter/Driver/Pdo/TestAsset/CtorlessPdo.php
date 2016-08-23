<?php

namespace ZendTest\Db\Adapter\Driver\Pdo\TestAsset;

class CtorlessPdo extends \Pdo
{
    protected $mockStatement;

    public function __construct($mockStatement)
    {
        $this->mockStatement = $mockStatement;
    }

    public function prepare($sql, $options = null)
    {
        return $this->mockStatement;
    }

}
