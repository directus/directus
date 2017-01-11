<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter;

interface StatementContainerInterface
{
    /**
     * Set sql
     *
     * @param $sql
     * @return mixed
     */
    public function setSql($sql);

    /**
     * Get sql
     *
     * @return mixed
     */
    public function getSql();

    /**
     * Set parameter container
     *
     * @param ParameterContainer $parameterContainer
     * @return mixed
     */
    public function setParameterContainer(ParameterContainer $parameterContainer);

    /**
     * Get parameter container
     *
     * @return mixed
     */
    public function getParameterContainer();
}
