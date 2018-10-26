<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

use Zend\Db\Adapter\StatementContainerInterface;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\ParameterContainer;

abstract class AbstractPreparableSql extends AbstractSql implements PreparableSqlInterface
{
    /**
     * {@inheritDoc}
     *
     * @return StatementContainerInterface
     */
    public function prepareStatement(AdapterInterface $adapter, StatementContainerInterface $statementContainer)
    {
        $parameterContainer = $statementContainer->getParameterContainer();

        if (! $parameterContainer instanceof ParameterContainer) {
            $parameterContainer = new ParameterContainer();

            $statementContainer->setParameterContainer($parameterContainer);
        }

        $statementContainer->setSql(
            $this->buildSqlString($adapter->getPlatform(), $adapter->getDriver(), $parameterContainer)
        );

        return $statementContainer;
    }
}
