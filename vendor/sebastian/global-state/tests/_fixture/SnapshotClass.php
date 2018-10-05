<?php
/*
 * This file is part of the GlobalState package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\GlobalState\TestFixture;

use DomDocument;
use ArrayObject;

/**
 */
class SnapshotClass
{
    private static $string = 'snapshot';
    private static $dom;
    private static $closure;
    private static $arrayObject;
    private static $snapshotDomDocument;
    private static $resource;
    private static $stdClass;

    public static function init()
    {
        self::$dom = new DomDocument();
        self::$closure = function () {};
        self::$arrayObject = new ArrayObject(array(1, 2, 3));
        self::$snapshotDomDocument = new SnapshotDomDocument();
        self::$resource = fopen('php://memory', 'r');
        self::$stdClass = new \stdClass();
    }
}
