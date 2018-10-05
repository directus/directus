<?php

namespace Directus\Application\Http\Middleware\RateLimit;

use Directus\Permissions\Acl;
use Psr\Http\Message\RequestInterface;
use RateLimit\Middleware\Identity\AbstractIdentityResolver;

final class UserIdentityResolver extends AbstractIdentityResolver
{
    protected $acl;

    public function __construct(Acl $acl)
    {
        $this->acl = $acl;
    }

    /**
     * {@inheritdoc}
     */
    public function getIdentity(RequestInterface $request)
    {
        return $this->acl->getUserId();
    }
}
