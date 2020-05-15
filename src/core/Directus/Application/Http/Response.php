<?php

namespace Directus\Application\Http;

class Response extends \Slim\Http\Response
{
    const HTTP_NOT_CONTENT          = 204;
    const HTTP_NOT_FOUND            = 404;
    const HTTP_METHOD_NOT_ALLOWED   = 405;

    const HTTP_SERVICE_UNAVAILABLE  = 503;

    /**
     * Sets multiple headers
     *
     * @param array $headers
     *
     * @return $this
     */
    public function withHeaders(array $headers)
    {
        foreach ($headers as $name => $value) {
            $this->headers->set($name, $value);
        }

        return $this;
    }

    /**
     * Sets key-value header information
     *
     * @param string $name
     * @param mixed $value
     *
     * @return $this
     */
    public function setHeader($name, $value)
    {
        return $this->withHeaders([$name => $value]);
    }

    /**
     * Json.
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * This method prepares the response object to return an HTTP Json
     * response to the client.
     *
     * @param  mixed  $data   The data
     * @param  int    $status The HTTP status code.
     * @param  int    $encodingOptions Json encoding options
     * @throws \RuntimeException
     * @return static
     */
    public function withScimJson($data, $status = null, $encodingOptions = 0)
    {
        $response = $this->withJson($data, $status, $encodingOptions);

        return $response->withHeader('Content-Type', 'application/scim+json;charset=utf-8');
    }
}
