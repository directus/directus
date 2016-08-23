<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Predicate;

use Zend\Db\Sql\Expression as BaseExpression;

class Expression extends BaseExpression implements PredicateInterface
{

    /**
     * Constructor
     *
     * @param string $expression
     * @param int|float|bool|string|array $valueParameter
     */
    public function __construct($expression = null, $valueParameter = null /*[, $valueParameter, ... ]*/)
    {
        if ($expression) {
            $this->setExpression($expression);
        }

        if (is_array($valueParameter)) {
            $this->setParameters($valueParameter);
        } else {
            $argNum = func_num_args();
            if ($argNum > 2 || is_scalar($valueParameter)) {
                $parameters = array();
                for ($i = 1; $i < $argNum; $i++) {
                    $parameters[] = func_get_arg($i);
                }
                $this->setParameters($parameters);
            }
        }
    }
}
