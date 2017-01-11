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
 * Class AbstractTimestampColumn
 * @package Zend\Db\Sql\Ddl\Column
 * @see doc section http://dev.mysql.com/doc/refman/5.6/en/timestamp-initialization.html
 */
abstract class AbstractTimestampColumn extends Column
{
    /**
     * @return array
     */
    public function getExpressionData()
    {
        $spec = $this->specification;

        $params   = [];
        $params[] = $this->name;
        $params[] = $this->type;

        $types = [self::TYPE_IDENTIFIER, self::TYPE_LITERAL];

        if (!$this->isNullable) {
            $spec .= ' NOT NULL';
        }

        if ($this->default !== null) {
            $spec    .= ' DEFAULT %s';
            $params[] = $this->default;
            $types[]  = self::TYPE_VALUE;
        }

        $options = $this->getOptions();

        if (isset($options['on_update'])) {
            $spec    .= ' %s';
            $params[] = 'ON UPDATE CURRENT_TIMESTAMP';
            $types[]  = self::TYPE_LITERAL;
        }

        $data = [[
            $spec,
            $params,
            $types,
        ]];

        foreach ($this->constraints as $constraint) {
            $data[] = ' ';
            $data = array_merge($data, $constraint->getExpressionData());
        }

        return $data;
    }
}
