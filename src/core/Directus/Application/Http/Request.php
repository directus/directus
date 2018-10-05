<?php

namespace Directus\Application\Http;

class Request extends \Slim\Http\Request
{
    /**
     * Get Request Origin
     *
     * @return mixed
     */
    public function getOrigin()
    {
        return $this->getHeader('Origin') ?: $this->getServerParam('HTTP_ORIGIN');
    }

    /**
     * Returns the Request Referer Url
     *
     * @return mixed
     */
    public function getReferer()
    {
        return $this->getHeader('Referer') ?: $this->getServerParam('HTTP_REFERER');
    }
}
