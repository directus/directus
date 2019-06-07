<?php

namespace Symfony\Component\Translation\Tests\DependencyInjection\fixtures;

use Symfony\Contracts\Translation\TranslatorInterface;

class ControllerArguments
{
    public function __invoke(TranslatorInterface $translator)
    {
    }

    public function index(TranslatorInterface $translator)
    {
    }
}
