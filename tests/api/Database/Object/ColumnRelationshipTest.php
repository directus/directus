<?php

class ColumnRelationshipTest extends PHPUnit_Framework_TestCase
{
    public function testColumnRelationship()
    {
        $data = [
            'type' => 'MANYTOMANY',
            'related_table' => 'projects',
            'junction_table' => 'projects_related',
            'junction_key_left' => 'project_id',
            'junction_key_right' => 'related_id'
        ];

        $relationship = new \Directus\Database\Object\ColumnRelationship($data);

        foreach($data as $attribute => $value) {
            $method = 'get' . \Directus\Util\StringUtils::underscoreToCamelCase($attribute, true);
            $result = call_user_func([$relationship, $method]);

            // these value must have been converted to boolean
            if (in_array($attribute, ['footer', 'hidden', 'single'])) {
                $value = (bool) $value;
            }

            $this->assertSame($result, $value);
        }
    }
}
