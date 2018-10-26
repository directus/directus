<?php

use Symfony\Component\Console\Helper\TableCell;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

//Ensure formatting tables when using multiple headers with TableCell
return function (InputInterface $input, OutputInterface $output) {
    $headers = array(
        array(new TableCell('Main table title', array('colspan' => 3))),
        array('ISBN', 'Title', 'Author'),
    );

    $rows = array(
        array(
            '978-0521567817',
            'De Monarchia',
            new TableCell("Dante Alighieri\nspans multiple rows", array('rowspan' => 2)),
        ),
        array('978-0804169127', 'Divine Comedy'),
    );

    $output = new SymfonyStyle($input, $output);
    $output->table($headers, $rows);
};
