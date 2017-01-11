<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Platform\Sqlite;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\Platform\PlatformDecoratorInterface;
use Zend\Db\Sql\Select;

class SelectDecorator extends Select implements PlatformDecoratorInterface
{
    /**
     * @var Select
     */
    protected $subject = null;

    /**
     * Set Subject
     *
     * @param Select $select
     * @return self
     */
    public function setSubject($select)
    {
        $this->subject = $select;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    protected function localizeVariables()
    {
        parent::localizeVariables();
        $this->specifications[self::COMBINE] = '%1$s %2$s';
    }

    /**
     * {@inheritDoc}
     */
    protected function processStatementStart(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        return '';
    }

    /**
     * {@inheritDoc}
     */
    protected function processStatementEnd(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        return '';
    }
}
