export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Ayer';
  }
  if (diffDays > 1 && diffDays < 7) {
    const label = date.toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}
