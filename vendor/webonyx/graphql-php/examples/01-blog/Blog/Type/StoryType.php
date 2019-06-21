<?php
namespace GraphQL\Examples\Blog\Type;

use GraphQL\Examples\Blog\AppContext;
use GraphQL\Examples\Blog\Data\DataSource;
use GraphQL\Examples\Blog\Data\Story;
use GraphQL\Examples\Blog\Types;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

/**
 * Class StoryType
 * @package GraphQL\Examples\Social\Type
 */
class StoryType extends ObjectType
{
    const EDIT = 'EDIT';
    const DELETE = 'DELETE';
    const LIKE = 'LIKE';
    const UNLIKE = 'UNLIKE';
    const REPLY = 'REPLY';

    public function __construct()
    {
        $config = [
            'name' => 'Story',
            'fields' => function() {
                return [
                    'id' => Types::id(),
                    'author' => Types::user(),
                    'mentions' => Types::listOf(Types::mention()),
                    'totalCommentCount' => Types::int(),
                    'comments' => [
                        'type' => Types::listOf(Types::comment()),
                        'args' => [
                            'after' => [
                                'type' => Types::id(),
                                'description' => 'Load all comments listed after given comment ID'
                            ],
                            'limit' => [
                                'type' => Types::int(),
                                'defaultValue' => 5
                            ]
                        ]
                    ],
                    'likes' => [
                        'type' => Types::listOf(Types::user()),
                        'args' => [
                            'limit' => [
                                'type' => Types::int(),
                                'description' => 'Limit the number of recent likes returned',
                                'defaultValue' => 5
                            ]
                        ]
                    ],
                    'likedBy' => [
                        'type' => Types::listOf(Types::user()),
                    ],
                    'affordances' => Types::listOf(new EnumType([
                        'name' => 'StoryAffordancesEnum',
                        'values' => [
                            self::EDIT,
                            self::DELETE,
                            self::LIKE,
                            self::UNLIKE,
                            self::REPLY
                        ]
                    ])),
                    'hasViewerLiked' => Types::boolean(),

                    Types::htmlField('body'),
                ];
            },
            'interfaces' => [
                Types::node()
            ],
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

    public function resolveAuthor(Story $story)
    {
        return DataSource::findUser($story->authorId);
    }

    public function resolveAffordances(Story $story, $args, AppContext $context)
    {
        $isViewer = $context->viewer === DataSource::findUser($story->authorId);
        $isLiked = DataSource::isLikedBy($story->id, $context->viewer->id);

        if ($isViewer) {
            $affordances[] = self::EDIT;
            $affordances[] = self::DELETE;
        }
        if ($isLiked) {
            $affordances[] = self::UNLIKE;
        } else {
            $affordances[] = self::LIKE;
        }
        return $affordances;
    }

    public function resolveHasViewerLiked(Story $story, $args, AppContext $context)
    {
        return DataSource::isLikedBy($story->id, $context->viewer->id);
    }

    public function resolveTotalCommentCount(Story $story)
    {
        return DataSource::countComments($story->id);
    }

    public function resolveComments(Story $story, $args)
    {
        $args += ['after' => null];
        return DataSource::findComments($story->id, $args['limit'], $args['after']);
    }
}
