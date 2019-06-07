<?php

namespace Symfony\Component\Translation\Tests\DependencyInjection\fixtures;

use Symfony\Contracts\Translation\TranslatorInterface;

class ServiceArguments
{
    public function __construct(TranslatorInterface $translator)
    {
    }
}
