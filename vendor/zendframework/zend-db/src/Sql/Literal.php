<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

class Literal implements ExpressionInterface
{
    /**
     * @var string
     */
    protected $literal = '';

    /**
     * @param $literal
     */
    public function __construct($literal = '')
    {
        $this->literal = $literal;
    }

    /**
     * @param string $literal
     * @return Literal
     */
    public function setLiteral($literal)
    {
        $this->literal = $literal;
        return $this;
    }

    /**
     * @return string
     */
    public function getLiteral()
    {
        return $this->literal;
    }

    /**
     * @return array
     */
    public function getExpressionData()
    {
        return [[
            str_replace('%', '%%', $this->literal),
            [],
            []
        ]];
    }
}
