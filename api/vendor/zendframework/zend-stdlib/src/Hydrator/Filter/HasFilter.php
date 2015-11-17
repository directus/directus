<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link           http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright      Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license        http://framework.zend.com/license/new-bsd New BSD License
 */
namespace Zend\Stdlib\Hydrator\Filter;

class HasFilter implements FilterInterface
{
    public function filter($property)
    {
        $pos = strpos($property, '::');
        if ($pos !== false) {
            $pos += 2;
        } else {
            $pos = 0;
        }

        if (substr($property, $pos, 3) === 'has') {
            return true;
        }
        return false;
    }
}
