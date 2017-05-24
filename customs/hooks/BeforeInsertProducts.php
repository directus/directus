<?php

namespace Directus\Customs\Hooks;

use Directus\Hook\HookInterface;
use Directus\Hook\Payload;

class BeforeInsertProducts implements HookInterface
{
    /**
     * @param Payload $payload
     *
     * @return Payload
     */
    public function handle($payload = null)
    {
        // set the product sku before insert
        // $payload->set('sku', 'value');

        file_put_contents('t-' . time() . '.txt', time());
        // make sure to return the payload
        return $payload;
    }
}
