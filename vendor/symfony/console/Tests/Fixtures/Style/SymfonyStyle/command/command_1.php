<?php

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

//Ensure has single blank line between titles and blocks
return function (InputInterface $input, OutputInterface $output) {
    $output = new SymfonyStyle($input, $output);
    $output->title('Title');
    $output->warning('Lorem ipsum dolor sit amet');
    $output->title('Title');
};
