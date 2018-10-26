<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim\Exception;

use RuntimeException;
use Interop\Container\Exception\NotFoundException as InteropNotFoundException;

/**
 * Not Found Exception
 */
class ContainerValueNotFoundException extends RuntimeException implements InteropNotFoundException
{

}
