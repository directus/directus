<?php

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class FooHiddenCommand extends Command
{
    protected function configure()
    {
        $this
            ->setName('foo:hidden')
            ->setAliases(['afoohidden'])
            ->setHidden(true)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
    }
}
