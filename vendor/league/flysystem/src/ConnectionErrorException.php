<?php

namespace League\Flysystem;

use ErrorException;

class ConnectionErrorException extends ErrorException implements FilesystemException
{
}
