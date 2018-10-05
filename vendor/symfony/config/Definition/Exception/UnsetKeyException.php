<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Definition\Exception;

/**
 * This exception is usually not encountered by the end-user, but only used
 * internally to signal the parent scope to unset a key.
 *
 * @author Johannes M. Schmitt <schmittjoh@gmail.com>
 */
class UnsetKeyException extends Exception
{
}
