// PostgreSQL sends numeric(12,2) values to us as JSON numbers (e.g. 20000.5).
// Every amount the API returns is turned into exact text with 2 decimals ("20000.50").
// numeric(12,2) holds at most 9,999,999,999.99, which a JavaScript number represents
// accurately enough that toFixed(2) always gives back the exact stored value.
export function toMoney(value: number | string): string {
  return Number(value).toFixed(2)
}
