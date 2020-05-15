<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl\Column;

/**
 * Column representing a FLOAT type.
 *
 * Cannot name a class "float" starting in PHP 7, as it's a reserved keyword;
 * hence, "floating", with a type of "FLOAT".
 */
class Floating extends AbstractPrecisionColumn
{
    /**
     * @var string
     */
    protected $type = 'FLOAT';
}
