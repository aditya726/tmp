type BadgeVariant = 'bcml' | 'gmt' | 'active' | 'inactive' | 'internal' | 'output' | 'neutral' | 'version';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  bcml:     'bg-blue-100 text-blue-700 border border-blue-200',
  gmt:      'bg-purple-100 text-purple-700 border border-purple-200',
  active:   'bg-green-100 text-green-700 border border-green-200',
  inactive: 'bg-slate-100 text-slate-500 border border-slate-200',
  internal: 'bg-amber-100 text-amber-700 border border-amber-200',
  output:   'bg-teal-100 text-teal-700 border border-teal-200',
  neutral:  'bg-slate-100 text-slate-600 border border-slate-200',
  version:  'bg-indigo-50 text-indigo-600 border border-indigo-100',
};

const dotMap: Record<BadgeVariant, string> = {
  active:   'bg-green-500',
  inactive: 'bg-slate-400',
  bcml:     'bg-blue-500',
  gmt:      'bg-purple-500',
  internal: 'bg-amber-500',
  output:   'bg-teal-500',
  neutral:  'bg-slate-400',
  version:  'bg-indigo-400',
};

const defaultLabels: Partial<Record<BadgeVariant, string>> = {
  bcml:     'BCML',
  gmt:      'GMT',
  active:   'Active',
  inactive: 'Inactive',
  internal: 'Internal',
  output:   'Output',
};

export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  const text = label ?? defaultLabels[variant] ?? variant;
  return (
    <span className={`badge ${variantMap[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotMap[variant]}`} />
      {text}
    </span>
  );
}

interface SourceTypeBadgeProps {
  sourceType?: string;
}

export function SourceTypeBadge({ sourceType }: SourceTypeBadgeProps) {
  const normalized = sourceType?.toUpperCase();
  if (normalized === 'GMT') return <StatusBadge variant="gmt" />;
  return <StatusBadge variant="bcml" label={sourceType || 'BCML'} />;
}
