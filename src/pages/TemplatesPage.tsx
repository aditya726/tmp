import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Layers,
  Activity,
  Database,
  RefreshCw,
  FileCode2,
  AlertCircle,
  Circle,
} from 'lucide-react';
import { templatesApi } from '../api/templatesApi';
import type { TemplateDto } from '../types/api';
import { StatusBadge, SourceTypeBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';

function TemplateSkeleton() {
  return (
    <div className="card p-4 space-y-2.5">
      <div className="skeleton h-4 w-28 rounded" />
      <div className="skeleton h-3 w-48 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-4 w-14 rounded" />
        <div className="skeleton h-4 w-12 rounded" />
      </div>
    </div>
  );
}

function TemplateCard({ template, onOpen }: { template: TemplateDto; onOpen: () => void }) {
  const accentColor = template.bcmlOrGmt?.toUpperCase() === 'GMT'
    ? 'border-l-purple-400'
    : 'border-l-blue-400';

  return (
    <div
      className={`card card-hover border-l-2 ${accentColor} p-4 cursor-pointer group`}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="font-semibold text-slate-800 text-[13px] truncate group-hover:text-blue-700 transition-colors">
          {template.name}
        </h3>
        <StatusBadge variant={template.active ? 'active' : 'inactive'} />
      </div>

      {template.description && (
        <p className="text-[12px] text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <SourceTypeBadge sourceType={template.bcmlOrGmt} />
          {template.version !== undefined && (
            <StatusBadge variant="version" label={`v${template.version}`} />
          )}
          {template.tsCollection && (
            <span className="badge bg-slate-50 text-slate-500 border border-slate-200">
              {template.tsCollection}
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
      </div>
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
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Report Templates</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Configure XML-to-CSV report mappings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isLoading
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {isConnected ? (
                <Circle size={7} fill="currentColor" />
              ) : isLoading ? (
                <Spinner size="sm" />
              ) : (
                <Circle size={7} fill="currentColor" />
              )}
              {isConnected ? 'Web Service Active' : isLoading ? 'Connecting…' : 'Web Service Offline'}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn-ghost"
              title="Refresh templates"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 max-w-7xl mx-auto">
        {/* Stats strip — compact, inline */}
        <div className="flex items-center gap-6 mb-5 text-[13px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">{templates?.length ?? '—'}</span>
            <span>templates</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-600">
            <Activity size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">{activeCount}</span>
            <span>active</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-600">
            <Database size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">{sourceTypes.length || '—'}</span>
            <span>source {sourceTypes.length === 1 ? 'type' : 'types'}</span>
            {sourceTypes.length > 0 && (
              <span className="text-slate-400 text-[11px]">({sourceTypes.join(', ')})</span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="template-search"
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-8"
            />
          </div>
          {templates && (
            <span className="text-[12px] text-slate-400">
              {filtered?.length} of {templates.length}
            </span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="card p-8 text-center max-w-md mx-auto mt-6">
            <AlertCircle size={20} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 text-[14px] mb-1">Failed to load templates</h3>
            <p className="text-[13px] text-slate-500 mb-4">
              {(error as Error)?.message || 'Unable to connect to the service.'}
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : filtered?.length === 0 ? (
          <div className="card p-8 text-center max-w-md mx-auto mt-6">
            <p className="text-[13px] text-slate-500 mb-1">
              {search ? `No templates match "${search}".` : 'No templates configured.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="btn-ghost mt-2 text-[12px]">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
