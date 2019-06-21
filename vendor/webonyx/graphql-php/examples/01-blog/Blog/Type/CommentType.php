<?php
namespace GraphQL\Examples\Blog\Type;

use GraphQL\Examples\Blog\AppContext;
use GraphQL\Examples\Blog\Data\Comment;
use GraphQL\Examples\Blog\Data\DataSource;
use GraphQL\Examples\Blog\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class CommentType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'name' => 'Comment',
            'fields' => function() {
                return [
                    'id' => Types::id(),
                    'author' => Types::user(),
                    'parent' => Types::comment(),
                    'isAnonymous' => Types::boolean(),
                    'replies' => [
                        'type' => Types::listOf(Types::comment()),
                        'args' => [
                            'after' => Types::int(),
                            'limit' => [
                                'type' => Types::int(),
                                'defaultValue' => 5
                            ]
                        ]
                    ],
                    'totalReplyCount' => Types::int(),

                    Types::htmlField('body')
                ];
            },
            'resolveField' => function($value, $args, $context, ResolveInfo $info) {
                $method = 'resolve' . ucfirst($info->fieldName);
                if (method_exists($this, $method)) {
                    return $this->{$method}($value, $args, $context, $info);
                } else {
                    return $value->{$info->fieldName};
                }
            }
        ];
        parent::__construct($config);
    }

    public function resolveAuthor(Comment $comment)
    {
        if ($comment->isAnonymous) {
            return null;
        }
        return DataSource::findUser($comment->authorId);
    }

    public function resolveParent(Comment $comment)
    {
        if ($comment->parentId) {
            return DataSource::findComment($comment->parentId);
        }
        return null;
    }

    public function resolveReplies(Comment $comment, $args)
    {
        $args += ['after' => null];
        return DataSource::findReplies($comment->id, $args['limit'], $args['after']);
    }

    public function resolveTotalReplyCount(Comment $comment)
    {
        return DataSource::countReplies($comment->id);
    }
}
