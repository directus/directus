<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Resource;

/**
 * ComposerResource tracks the PHP version and Composer dependencies.
 *
 * @author Nicolas Grekas <p@tchwork.com>
 */
class ComposerResource implements SelfCheckingResourceInterface, \Serializable
{
    private $vendors;

    private static $runtimeVendors;

    public function __construct()
    {
        self::refresh();
        $this->vendors = self::$runtimeVendors;
    }

    public function getVendors()
    {
        return array_keys($this->vendors);
    }

    /**
     * {@inheritdoc}
     */
    public function __toString()
    {
        return __CLASS__;
    }

    /**
     * {@inheritdoc}
     */
    public function isFresh($timestamp)
    {
        self::refresh();

        return self::$runtimeVendors === $this->vendors;
    }

    public function serialize()
    {
        return serialize($this->vendors);
    }

    public function unserialize($serialized)
    {
        $this->vendors = unserialize($serialized);
    }

    private static function refresh()
    {
        self::$runtimeVendors = array();

        foreach (get_declared_classes() as $class) {
            if ('C' === $class[0] && 0 === strpos($class, 'ComposerAutoloaderInit')) {
                $r = new \ReflectionClass($class);
                $v = \dirname(\dirname($r->getFileName()));
                if (file_exists($v.'/composer/installed.json')) {
                    self::$runtimeVendors[$v] = @filemtime($v.'/composer/installed.json');
                }
            }
        }
    }
}
