import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Layers,
  Activity,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  FileCode2,
  AlertCircle,
} from 'lucide-react';
import { templatesApi } from '../api/templatesApi';
import type { TemplateDto } from '../types/api';
import { StatusBadge, SourceTypeBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';

function TemplateSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-3.5 w-56 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-8 w-full rounded-lg mt-2" />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <div className="card px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function TemplateCard({ template, onOpen }: { template: TemplateDto; onOpen: () => void }) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200 animate-fade-in group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FileCode2 size={15} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
            {template.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <StatusBadge variant={template.active ? 'active' : 'inactive'} />
        </div>
      </div>

      {template.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <SourceTypeBadge sourceType={template.bcmlOrGmt} />
        {template.version !== undefined && (
          <StatusBadge variant="version" label={`v${template.version}`} />
        )}
        {template.tsCollection && (
          <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
            {template.tsCollection}
          </span>
        )}
      </div>

      <button
        id={`open-builder-${template.id}`}
        onClick={onOpen}
        className="btn-primary w-full justify-center text-xs"
      >
        Open Builder
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export function TemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const {
    data: templates,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getTemplates(),
    retry: 1,
  });

  const filtered = templates?.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.bcmlOrGmt?.toLowerCase().includes(q) ||
      t.tsCollection?.toLowerCase().includes(q)
    );
  });

  const activeCount = templates?.filter((t) => t.active).length ?? 0;
  const sourceTypes = [...new Set(templates?.map((t) => t.bcmlOrGmt).filter(Boolean))];
  const isConnected = !isError && !isLoading;

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Report Templates</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure XML-to-CSV report mappings without code changes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : isLoading
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {isConnected ? (
                <Wifi size={12} />
              ) : isLoading ? (
                <Spinner size="sm" />
              ) : (
                <WifiOff size={12} />
              )}
              {isConnected ? 'Backend Connected' : isLoading ? 'Connecting…' : 'Backend Offline'}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn-ghost"
              title="Refresh templates"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* Stats Strip */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Layers size={18} />}
            label="Total Templates"
            value={templates?.length ?? '—'}
            color="blue"
          />
          <StatCard
            icon={<Activity size={18} />}
            label="Active Templates"
            value={activeCount}
            color="green"
          />
          <StatCard
            icon={<Database size={18} />}
            label="Source Types"
            value={sourceTypes.length || '—'}
            sub={sourceTypes.join(', ') || undefined}
            color="purple"
          />
          <StatCard
            icon={isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
            label="Backend Status"
            value={isConnected ? 'Connected' : isLoading ? 'Connecting' : 'Offline'}
            color="teal"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="template-search"
              type="text"
              placeholder="Search by name, source, collection…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          {templates && (
            <span className="text-xs text-slate-500">
              {filtered?.length} of {templates.length} templates
            </span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="card p-8 text-center max-w-md mx-auto mt-8">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Failed to load templates</h3>
            <p className="text-sm text-slate-500 mb-4">
              {(error as Error)?.message || 'Unable to connect to backend.'}
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : filtered?.length === 0 ? (
          <div className="card p-10 text-center max-w-md mx-auto mt-8">
            <FileCode2 size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No templates found</h3>
            <p className="text-sm text-slate-400">
              {search ? `No templates match "${search}".` : 'No templates are configured yet.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="btn-secondary mt-4">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered?.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onOpen={() => navigate(`/templates/${t.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
