/**
 * Extracts the length value out of a given datatype
 * For example: `varchar(32)` => 32
 */
export default function extractMaxLength(type: string): null | number {
  const regex = /\(([^)]+)\)/;
  const matches = regex.exec(type);

  if (matches && matches.length > 0 && matches[1]) {
    return Number(matches[1]);
  }

  return null;
}
