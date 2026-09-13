export function formatCronExpression(expression: string): string {
  if (!expression || typeof expression !== 'string') return 'Custom Schedule';

  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return expression;

  const [min, hour, dom, mon, dow] = parts;

  if (min === '0' && hour === '0' && dom === '*' && mon === '*' && dow === '*') return 'Every day at 12:00 AM (Midnight)';
  if (min === '0' && hour === '2' && dom === '*' && mon === '*' && dow === '*') return 'Every day at 2:00 AM';
  if (min === '0' && hour === '12' && dom === '*' && mon === '*' && dow === '*') return 'Every day at 12:00 PM (Noon)';
  if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') return 'Every hour on the hour';
  if (min === '0' && hour === '0' && dom === '*' && mon === '*' && dow === '0') return 'Every Sunday at Midnight';
  if (min === '0' && hour === '0' && dom === '1' && mon === '*' && dow === '*') return 'First day of every month at Midnight';

  if (min.startsWith('*/')) return `Every ${min.substring(2)} minutes`;
  if (hour.startsWith('*/')) return `Every ${hour.substring(2)} hours`;

  return `Cron (${expression})`;
}
