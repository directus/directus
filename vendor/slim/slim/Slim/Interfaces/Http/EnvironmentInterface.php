<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim\Interfaces\Http;

interface EnvironmentInterface
{
    /**
     * Create mock environment
     *
     * @param  array $settings Array of custom environment keys and values
     *
     * @return EnvironmentInterface
     */
    public static function mock(array $settings = []);
}
