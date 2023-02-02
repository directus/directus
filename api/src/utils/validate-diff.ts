import Joi from 'joi';
import { InvalidPayloadException } from '../index';
import { DiffKind, SnapshotDiffWithHash, SnapshotWithHash } from '../types/snapshot';

const deepDiffSchema = Joi.object({
	kind: Joi.string()
		.valid(...Object.values(DiffKind))
		.required(),
	path: Joi.array().items(Joi.string()),
	lhs: Joi.object().when('kind', { is: [DiffKind.DELETE, DiffKind.EDIT], then: Joi.required() }),
	rhs: Joi.object().when('kind', { is: [DiffKind.NEW, DiffKind.EDIT], then: Joi.required() }),
	index: Joi.number().when('kind', { is: DiffKind.ARRAY, then: Joi.required() }),
	item: Joi.link('/').when('kind', { is: DiffKind.ARRAY, then: Joi.required() }),
});

const applyJoiSchema = Joi.object({
	hash: Joi.string().required(),
	diff: Joi.object({
		collections: Joi.array()
			.items(
				Joi.object({
					collection: Joi.string().required(),
					diff: Joi.array().items(deepDiffSchema).required(),
				})
			)
			.required(),
		fields: Joi.array()
			.items(
				Joi.object({
					collection: Joi.string().required(),
					field: Joi.string().required(),
					diff: Joi.array().items(deepDiffSchema).required(),
				})
			)
			.required(),
		relations: Joi.array()
			.items(
				Joi.object({
					collection: Joi.string().required(),
					field: Joi.string().required(),
					related_collection: Joi.string(),
					diff: Joi.array().items(deepDiffSchema).required(),
				})
			)
			.required(),
	}).required(),
});

/**
 * Validates the diff against the current schema snapshot.
 *
 * @returns True if the diff can be applied (valid & not empty).
 */
export function validateApplyDiff(applyDiff: SnapshotDiffWithHash, currentSnapshotWithHash: SnapshotWithHash) {
	const { error } = applyJoiSchema.validate(applyDiff);
	if (error) throw new InvalidPayloadException(error.message);

	// No changes to apply
	if (
		applyDiff.diff.collections.length === 0 &&
		applyDiff.diff.fields.length === 0 &&
		applyDiff.diff.relations.length === 0
	) {
		return false;
	}

	// Diff can be applied due to matching hash
	if (applyDiff.hash === currentSnapshotWithHash.hash) return true;

	for (const diffCollection of applyDiff.diff.collections) {
		const collection = diffCollection.collection;

		if (diffCollection.diff[0]?.kind === DiffKind.NEW) {
			const existingCollection = currentSnapshotWithHash.collections.find(
				(c) => c.collection === diffCollection.collection
			);

			if (existingCollection) {
				throw new InvalidPayloadException(
					`Provided diff is trying to create collection "${collection}" but it already exists. Please generate a new diff and try again.`
				);
			}
		} else if (diffCollection.diff[0]?.kind === DiffKind.DELETE) {
			const existingCollection = currentSnapshotWithHash.collections.find(
				(c) => c.collection === diffCollection.collection
			);

			if (!existingCollection) {
				throw new InvalidPayloadException(
					`Provided diff is trying to delete collection "${collection}" but it does not exist. Please generate a new diff and try again.`
				);
			}
		}
	}
	for (const diffField of applyDiff.diff.fields) {
		const field = `${diffField.collection}.${diffField.field}`;

		if (diffField.diff[0]?.kind === DiffKind.NEW) {
			const existingField = currentSnapshotWithHash.fields.find(
				(f) => f.collection === diffField.collection && f.field === diffField.field
			);

			if (existingField) {
				throw new InvalidPayloadException(
					`Provided diff is trying to create field "${field}" but it already exists. Please generate a new diff and try again.`
				);
			}
		} else if (diffField.diff[0]?.kind === DiffKind.DELETE) {
			const existingField = currentSnapshotWithHash.fields.find(
				(f) => f.collection === diffField.collection && f.field === diffField.field
			);

			if (!existingField) {
				throw new InvalidPayloadException(
					`Provided diff is trying to delete field "${field}" but it does not exist. Please generate a new diff and try again.`
				);
			}
		}
	}
	for (const diffRelation of applyDiff.diff.relations) {
		let relation = `${diffRelation.collection}.${diffRelation.field}`;
		if (diffRelation.related_collection) relation += `-> ${diffRelation.related_collection}`;

		if (diffRelation.diff[0]?.kind === DiffKind.NEW) {
			const existingRelation = currentSnapshotWithHash.relations.find(
				(r) => r.collection === diffRelation.collection && r.field === diffRelation.field
			);

			if (existingRelation) {
				throw new InvalidPayloadException(
					`Provided diff is trying to create relation "${relation}" but it already exists. Please generate a new diff and try again.`
				);
			}
		} else if (diffRelation.diff[0]?.kind === DiffKind.DELETE) {
			const existingRelation = currentSnapshotWithHash.relations.find(
				(r) => r.collection === diffRelation.collection && r.field === diffRelation.field
			);

			if (!existingRelation) {
				throw new InvalidPayloadException(
					`Provided diff is trying to delete relation "${relation}" but it does not exist. Please generate a new diff and try again.`
				);
			}
		}
	}

	throw new InvalidPayloadException(
		`Provided hash does not match the current instance's schema hash, indicating the schema has changed after this diff was generated. Please generate a new diff and try again.`
	);
}
