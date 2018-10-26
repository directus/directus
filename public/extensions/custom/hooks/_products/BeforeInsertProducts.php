<?php

namespace Directus\Custom\Hooks\Products;

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

        // make sure to return the payload
        return $payload;
    }
}
