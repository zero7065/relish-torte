export function naira(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Custom quote';
  return `₦${value.toLocaleString('en-NG')}`;
}

export function minOrderDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

export function prettyDate(value: string): string {
  if (!value) return '—';
  const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}
