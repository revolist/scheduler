/**
 * Unit tests exercise showcase configuration, not the date editor UI. The
 * published date-column ESM bundle imports CSS directly, which Node cannot
 * evaluate, so Vitest substitutes this API-compatible surface.
 */
export class ColumnEditor {}

export default class DateColumnType {}
