<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\HttpClient\Exception;

/**
 * When a 5xx response is returned.
 *
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @experimental in 1.1
 */
interface ServerExceptionInterface extends HttpExceptionInterface
{
}
