<?php
namespace ZendTest\Db\TestAsset;

class PdoStubDriver extends \PDO
{
    public function beginTransaction()
    {
        return true;
    }

    public function commit()
    {
        return true;
    }

    public function __construct($dsn, $user, $password)
    {
    }

    public function rollBack()
    {
        return true;
    }
}
