<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim\Interfaces\Http;

use Slim\Interfaces\CollectionInterface;

/**
 * Headers Interface
 *
 * @package Slim
 * @since   3.0.0
 */
interface HeadersInterface extends CollectionInterface
{
    public function add($key, $value);

    public function normalizeKey($key);
}
