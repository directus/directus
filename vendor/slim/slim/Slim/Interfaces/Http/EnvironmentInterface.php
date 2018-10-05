<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim\Interfaces\Http;

/**
 * Environment Interface
 *
 * @package Slim
 * @since   3.0.0
 */
interface EnvironmentInterface
{
    public static function mock(array $settings = []);
}
