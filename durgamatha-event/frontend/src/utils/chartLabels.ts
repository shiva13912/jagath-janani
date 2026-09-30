// Long event names are cut on a chart axis (the tooltip still shows the full name)
export function shortenLabel(name: string): string {
  return name.length > 11 ? `${name.slice(0, 10)}…` : name
}
