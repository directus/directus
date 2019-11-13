<?php
namespace GuzzleHttp;

use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;

/**
 * Represents data at the point after it was transferred either successfully
 * or after a network error.
 */
final class TransferStats
{
    private $request;
    private $response;
    private $transferTime;
    private $handlerStats;
    private $handlerErrorData;

    /**
     * @param RequestInterface  $request          Request that was sent.
     * @param ResponseInterface $response         Response received (if any)
     * @param float|null        $transferTime     Total handler transfer time.
     * @param mixed             $handlerErrorData Handler error data.
     * @param array             $handlerStats     Handler specific stats.
     */
    public function __construct(
        RequestInterface $request,
        ResponseInterface $response = null,
        $transferTime = null,
        $handlerErrorData = null,
        $handlerStats = []
    ) {
        $this->request = $request;
        $this->response = $response;
        $this->transferTime = $transferTime;
        $this->handlerErrorData = $handlerErrorData;
        $this->handlerStats = $handlerStats;
    }

    /**
     * @return RequestInterface
     */
    public function getRequest()
    {
        return $this->request;
    }

    /**
     * Returns the response that was received (if any).
     *
     * @return ResponseInterface|null
     */
    public function getResponse()
    {
        return $this->response;
    }

    /**
     * Returns true if a response was received.
     *
     * @return bool
     */
    public function hasResponse()
    {
        return $this->response !== null;
    }

    /**
     * Gets handler specific error data.
     *
     * This might be an exception, a integer representing an error code, or
     * anything else. Relying on this value assumes that you know what handler
     * you are using.
     *
     * @return mixed
     */
    public function getHandlerErrorData()
    {
        return $this->handlerErrorData;
    }

    /**
     * Get the effective URI the request was sent to.
     *
     * @return UriInterface
     */
    public function getEffectiveUri()
    {
        return $this->request->getUri();
    }

    /**
     * Get the estimated time the request was being transferred by the handler.
     *
     * @return float Time in seconds.
     */
    public function getTransferTime()
    {
        return $this->transferTime;
    }

    /**
     * Gets an array of all of the handler specific transfer data.
     *
     * @return array
     */
    public function getHandlerStats()
    {
        return $this->handlerStats;
    }

    /**
     * Get a specific handler statistic from the handler by name.
     *
     * @param string $stat Handler specific transfer stat to retrieve.
     *
     * @return mixed|null
     */
    public function getHandlerStat($stat)
    {
        return isset($this->handlerStats[$stat])
            ? $this->handlerStats[$stat]
            : null;
    }
}
