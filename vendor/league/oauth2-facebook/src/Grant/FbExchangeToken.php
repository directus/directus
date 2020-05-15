<?php

namespace League\OAuth2\Client\Grant;

class FbExchangeToken extends AbstractGrant
{
    public function __toString()
    {
        return 'fb_exchange_token';
    }

    protected function getRequiredRequestParameters()
    {
        return [
            'fb_exchange_token',
        ];
    }

    protected function getName()
    {
        return 'fb_exchange_token';
    }
}
