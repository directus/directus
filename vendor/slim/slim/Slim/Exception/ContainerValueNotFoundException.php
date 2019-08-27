<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim\Exception;

use Interop\Container\Exception\NotFoundException as InteropNotFoundException;
use RuntimeException;

class ContainerValueNotFoundException extends RuntimeException implements InteropNotFoundException
{
}
