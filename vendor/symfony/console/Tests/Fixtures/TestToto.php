<?php

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class TestToto extends Command
{
    protected function configure()
    {
        $this
            ->setName('test-toto')
            ->setDescription('The test-toto command')
            ->setAliases(array('test'))
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $output->write('test-toto');
    }
}
