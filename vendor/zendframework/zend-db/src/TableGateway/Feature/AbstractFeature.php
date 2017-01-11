<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\TableGateway\Feature;

use Zend\Db\TableGateway\AbstractTableGateway;
use Zend\Db\TableGateway\Exception;

abstract class AbstractFeature extends AbstractTableGateway
{
    /**
     * @var AbstractTableGateway
     */
    protected $tableGateway = null;

    protected $sharedData = [];

    public function getName()
    {
        return get_class($this);
    }

    public function setTableGateway(AbstractTableGateway $tableGateway)
    {
        $this->tableGateway = $tableGateway;
    }

    public function initialize()
    {
        throw new Exception\RuntimeException('This method is not intended to be called on this object.');
    }

    public function getMagicMethodSpecifications()
    {
        return [];
    }


    /*
    public function preInitialize();
    public function postInitialize();
    public function preSelect(Select $select);
    public function postSelect(StatementInterface $statement, ResultInterface $result, ResultSetInterface $resultSet);
    public function preInsert(Insert $insert);
    public function postInsert(StatementInterface $statement, ResultInterface $result);
    public function preUpdate(Update $update);
    public function postUpdate(StatementInterface $statement, ResultInterface $result);
    public function preDelete(Delete $delete);
    public function postDelete(StatementInterface $statement, ResultInterface $result);
    */
}
