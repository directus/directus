<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\HttpClient;

use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

/**
 * The interface of chunks returned by ResponseStreamInterface::current().
 *
 * When the chunk is first, last or timeout, the content MUST be empty.
 * When an unchecked timeout or a network error occurs, a TransportExceptionInterface
 * MUST be thrown by the destructor unless one was already thrown by another method.
 *
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @experimental in 1.1
 */
interface ChunkInterface
{
    /**
     * Tells when the inactivity timeout has been reached.
     *
     * @throws TransportExceptionInterface on a network error
     */
    public function isTimeout(): bool;

    /**
     * Tells when headers just arrived.
     *
     * @throws TransportExceptionInterface on a network error or when the inactivity timeout is reached
     */
    public function isFirst(): bool;

    /**
     * Tells when the body just completed.
     *
     * @throws TransportExceptionInterface on a network error or when the inactivity timeout is reached
     */
    public function isLast(): bool;

    /**
     * Returns the content of the response chunk.
     *
     * @throws TransportExceptionInterface on a network error or when the inactivity timeout is reached
     */
    public function getContent(): string;

    /**
     * Returns the offset of the chunk in the response body.
     */
    public function getOffset(): int;

    /**
     * In case of error, returns the message that describes it.
     */
    public function getError(): ?string;
}
