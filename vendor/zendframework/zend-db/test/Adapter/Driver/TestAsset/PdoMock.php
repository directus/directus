<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\TestAsset;

/**
 * Stub class
 */
class PdoMock extends \PDO
{
    public function __construct()
    {
    }

    public function beginTransaction()
    {
        return true;
    }

    public function commit()
    {
        return true;
    }

    public function getAttribute($attribute)
    {
    }

    public function rollBack()
    {
        return true;
    }
}
