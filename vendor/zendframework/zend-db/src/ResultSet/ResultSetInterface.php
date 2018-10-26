<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\ResultSet;

use Countable;
use Traversable;

interface ResultSetInterface extends Traversable, Countable
{
    /**
     * Can be anything traversable|array
     * @abstract
     * @param $dataSource
     * @return mixed
     */
    public function initialize($dataSource);

    /**
     * Field terminology is more correct as information coming back
     * from the database might be a column, and/or the result of an
     * operation or intersection of some data
     * @abstract
     * @return mixed
     */
    public function getFieldCount();
}
