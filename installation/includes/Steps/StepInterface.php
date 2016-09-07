<?php

namespace Directus\Installation\Steps;

use Directus\Installation\DataContainer;

interface StepInterface
{
    public function getNumber();

    public function getName();

    public function getTitle();

    public function getShortTitle();

    public function getViewName();

    public function isDone();

    public function isPending();

    public function setDone($done);

    public function setDataContainer(DataContainer $dataContainer);

    public function getDataContainer();

    public function getData($key);

    public function getResponse();

    public function preRun(&$state);

    public function run($data, $step, &$state);
}
