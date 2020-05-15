<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\SessionHandler;

/**
 * @author Daniel Bannert <d.bannert@anolilab.de>
 *
 * ported from https://github.com/symfony/symfony/blob/master/src/Symfony/Component/HttpFoundation/Session/Storage/Handler/AbstractSessionHandler.php
 */
abstract class AbstractSessionHandler implements \SessionHandlerInterface, \SessionUpdateTimestampHandlerInterface
{
    /**
     * @type string|null
     */
    private $sessionName;

    /**
     * @type string|null
     */
    private $prefetchId;

    /**
     * @type string|null
     */
    private $prefetchData;

    /**
     * @type string|null
     */
    private $newSessionId;

    /**
     * @type string|null
     */
    private $igbinaryEmptyData;

    /**
     * {@inheritdoc}
     */
    public function open($savePath, $sessionName)
    {
        $this->sessionName = $sessionName;

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function validateId($sessionId)
    {
        $this->prefetchData = $this->read($sessionId);
        $this->prefetchId   = $sessionId;

        return $this->prefetchData !== '';
    }

    /**
     * {@inheritdoc}
     */
    public function read($sessionId)
    {
        if ($this->prefetchId !== null) {
            $prefetchId   = $this->prefetchId;
            $prefetchData = $this->prefetchData;

            $this->prefetchId = $this->prefetchData = null;

            if ($prefetchId === $sessionId || '' === $prefetchData) {
                $this->newSessionId = '' === $prefetchData ? $sessionId : null;

                return $prefetchData;
            }
        }

        $data               = $this->doRead($sessionId);
        $this->newSessionId = '' === $data ? $sessionId : null;

        if (\PHP_VERSION_ID < 70000) {
            $this->prefetchData = $data;
        }

        return $data;
    }

    /**
     * {@inheritdoc}
     */
    public function write($sessionId, $data)
    {
        if (\PHP_VERSION_ID < 70000 && $this->prefetchData) {
            $readData           = $this->prefetchData;
            $this->prefetchData = null;

            if ($readData === $data) {
                return $this->updateTimestamp($sessionId, $data);
            }
        }

        if ($this->igbinaryEmptyData === null) {
            // see igbinary/igbinary/issues/146
            $this->igbinaryEmptyData = \function_exists('igbinary_serialize') ? igbinary_serialize([]) : '';
        }

        if ($data === '' || $this->igbinaryEmptyData === $data) {
            return $this->destroy($sessionId);
        }

        $this->newSessionId = null;

        return $this->doWrite($sessionId, $data);
    }

    /**
     * {@inheritdoc}
     */
    public function destroy($sessionId)
    {
        if (\PHP_VERSION_ID < 70000) {
            $this->prefetchData = null;
        }

        return $this->newSessionId === $sessionId || $this->doDestroy($sessionId);
    }

    /**
     * {@inheritdoc}
     */
    public function close()
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function gc($lifetime)
    {
        // not required here because cache will auto expire the records anyhow.
        return true;
    }

    /**
     * @param string $sessionId
     *
     * @return string
     */
    abstract protected function doRead($sessionId);

    /**
     * @param string $sessionId
     * @param string $data
     *
     * @return bool
     */
    abstract protected function doWrite($sessionId, $data);

    /**
     * @param string $sessionId
     *
     * @return bool
     */
    abstract protected function doDestroy($sessionId);
}
