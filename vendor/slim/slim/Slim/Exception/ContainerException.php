<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim\Exception;

use Psr\Container\ContainerExceptionInterface;
use InvalidArgumentException;

class ContainerException extends InvalidArgumentException implements ContainerExceptionInterface
{
}
