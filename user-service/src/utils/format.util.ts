export function formatDate(date: Date | string): string {
  const parsedDate = new Date(date);
  return parsedDate.toLocaleDateString('en-GB');
}
