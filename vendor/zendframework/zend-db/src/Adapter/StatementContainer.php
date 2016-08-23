<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter;

class StatementContainer implements StatementContainerInterface
{

    /**
     * @var string
     */
    protected $sql = '';

    /**
     * @var ParameterContainer
     */
    protected $parameterContainer = null;

    /**
     * @param string|null $sql
     * @param ParameterContainer|null $parameterContainer
     */
    public function __construct($sql = null, ParameterContainer $parameterContainer = null)
    {
        if ($sql) {
            $this->setSql($sql);
        }
        $this->parameterContainer = ($parameterContainer) ?: new ParameterContainer;
    }

    /**
     * @param $sql
     * @return StatementContainer
     */
    public function setSql($sql)
    {
        $this->sql = $sql;
        return $this;
    }

    /**
     * @return string
     */
    public function getSql()
    {
        return $this->sql;
    }

    /**
     * @param ParameterContainer $parameterContainer
     * @return StatementContainer
     */
    public function setParameterContainer(ParameterContainer $parameterContainer)
    {
        $this->parameterContainer = $parameterContainer;
        return $this;
    }

    /**
     * @return null|ParameterContainer
     */
    public function getParameterContainer()
    {
        return $this->parameterContainer;
    }
}
