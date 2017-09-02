<?php

namespace Directus\Database\Exception;

class RelationshipMetadataException extends DbException
{
    protected $httpStatus = 424;
}
