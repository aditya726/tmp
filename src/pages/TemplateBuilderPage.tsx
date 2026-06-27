import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  Layers,
  Database,
  Code2,
  AlertCircle,
} from 'lucide-react';
import { templatesApi } from '../api/templatesApi';
import type { FieldMappingDto } from '../types/api';
import { SourceTypeBadge, StatusBadge } from '../components/ui/StatusBadge';
import { CataloguePanel } from '../components/template-builder/CataloguePanel';
import { XmlViewerPanel } from '../components/xml-tree/XmlViewerPanel';
import { MappingsTable } from '../components/template-builder/MappingsTable';
import { MappingEditorDrawer } from '../components/template-builder/MappingEditorDrawer';
import { PreviewPanel } from '../components/template-builder/PreviewPanel';
import { PageSpinner } from '../components/ui/Spinner';

type LeftTab = 'catalogue' | 'xml';
type RightTab = 'mappings' | 'preview';

function WorkflowBar({ step }: { step: number }) {
  const labels = ['Select Field', 'Configure Mapping', 'Preview'];
  return (
    <div className="flex items-center gap-0.5">
      {labels.map((label, i) => (
        <span key={i} className="flex items-center">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
              i < step
                ? 'text-emerald-700 bg-emerald-50'
                : i === step
                ? 'text-blue-700 bg-blue-50'
                : 'text-slate-400'
            }`}
          >
            {i + 1}. {label}
          </span>
          {i < labels.length - 1 && (
            <span className="text-slate-300 mx-0.5 text-[10px]">→</span>
          )}
        </span>
      ))}
    </div>
  );
}

interface TemplateBuilderPageProps {
  onToast: (type: 'success' | 'error', title: string, message?: string) => void;
}

export function TemplateBuilderPage({ onToast }: TemplateBuilderPageProps) {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const id = Number(templateId);

  const [leftTab, setLeftTab] = useState<LeftTab>('catalogue');
  const [rightTab, setRightTab] = useState<RightTab>('mappings');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editField, setEditField] = useState<FieldMappingDto | null>(null);
  const [draft, setDraft] = useState<Partial<FieldMappingDto> | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const {
    data: template,
    isLoading: templateLoading,
    isError: templateError,
    error: templateErr,
  } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getTemplate(id),
    enabled: !!id,
  });

  const {
    data: fields,
    isLoading: fieldsLoading,
    refetch: refetchFields,
    isFetching: fieldsFetching,
  } = useQuery({
    queryKey: ['fields', id],
    queryFn: () => templatesApi.getTemplateFields(id),
    enabled: !!id,
  });

  const handleSelectField = useCallback((draftMapping: Partial<FieldMappingDto>) => {
    setDraft(draftMapping);
    setEditField(null);
    setDrawerOpen(true);
    setCurrentStep(1);
  }, []);

  const handleEdit = useCallback((field: FieldMappingDto) => {
    setEditField(field);
    setDraft(null);
    setDrawerOpen(true);
    setCurrentStep(1);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditField(null);
    setDraft(null);
    setDrawerOpen(true);
    setCurrentStep(1);
  }, []);

  const handleSaved = useCallback(
    (action: 'created' | 'updated', header: string) => {
      onToast('success', `Mapping ${action}`, `"${header}" was successfully ${action}.`);
      setCurrentStep(2);
    },
    [onToast]
  );

  const handleDeleted = useCallback(
    (header: string) => {
      onToast('success', 'Mapping deleted', `"${header}" was removed from the template.`);
    },
    [onToast]
  );

  const handleError = useCallback(
    (msg: string) => {
      onToast('error', 'Operation failed', msg);
    },
    [onToast]
  );

  if (templateLoading) return <PageSpinner />;

  if (templateError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle size={24} className="text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 text-[14px] mb-1">Failed to load template</h3>
          <p className="text-[13px] text-slate-500 mb-4">{(templateErr as Error)?.message}</p>
          <button onClick={() => navigate('/templates')} className="btn-secondary">
            <ArrowLeft size={13} /> Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const sourceType = template?.bcmlOrGmt || 'BCML';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top header bar ─────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-5 py-2.5 z-20">
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => navigate('/templates')}
            className="btn-ghost text-[12px] shrink-0"
          >
            <ArrowLeft size={13} />
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Template info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[14px] font-semibold text-slate-900 truncate">{template?.name}</h1>
                <SourceTypeBadge sourceType={sourceType} />
                {template?.version !== undefined && (
                  <StatusBadge variant="version" label={`v${template.version}`} />
                )}
                {template?.active !== undefined && (
                  <StatusBadge variant={template.active ? 'active' : 'inactive'} />
                )}
              </div>
              {template?.description && (
                <p className="text-[11px] text-slate-400 truncate">{template.description}</p>
              )}
            </div>
          </div>

          {/* Workflow bar */}
          <div className="shrink-0 hidden xl:block">
            <WorkflowBar step={currentStep} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => refetchFields()}
              disabled={fieldsFetching}
              className="btn-ghost text-[12px]"
              title="Refresh mappings"
            >
              <RefreshCw size={12} className={fieldsFetching ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setRightTab('preview')}
              className={`btn-primary text-[12px] ${rightTab === 'preview' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
            >
              <Eye size={12} />
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* ── Main two-panel content ──────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ─ Field Discovery ──────── */}
        <div className="w-80 xl:w-[360px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button
              onClick={() => setLeftTab('catalogue')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors border-b-2 ${
                leftTab === 'catalogue'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Database size={12} />
              Catalogue
            </button>
            <button
              onClick={() => setLeftTab('xml')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium transition-colors border-b-2 ${
                leftTab === 'xml'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Code2 size={12} />
              XML Viewer
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {leftTab === 'catalogue' ? (
              <CataloguePanel
                sourceType={sourceType}
                onSelectField={handleSelectField}
                selectedXPath={draft?.xpathExpr}
              />
            ) : (
              <XmlViewerPanel onSelectNode={handleSelectField} />
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ─ Mapping Workspace ───── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab switcher */}
          <div className="flex items-center border-b border-slate-200 bg-white px-3 shrink-0">
            <button
              onClick={() => setRightTab('mappings')}
              className={`flex items-center gap-1.5 py-2 px-2.5 text-[12px] font-medium transition-colors border-b-2 ${
                rightTab === 'mappings'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Layers size={12} />
              Field Mappings
              {fields && (
                <span className="ml-0.5 text-[10px] text-slate-400 font-normal">
                  ({fields.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setRightTab('preview')}
              className={`flex items-center gap-1.5 py-2 px-2.5 text-[12px] font-medium transition-colors border-b-2 ${
                rightTab === 'preview'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Eye size={12} />
              Preview
            </button>
          </div>

          {/* Right panel content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'mappings' ? (
              <MappingsTable
                templateId={id}
                fields={fields ?? []}
                isLoading={fieldsLoading}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                onDeleted={handleDeleted}
                onDeleteError={handleError}
              />
            ) : (
              <PreviewPanel templateId={id} templateName={template?.name ?? ''} />
            )}
          </div>
        </div>
      </div>

      {/* ── Drawer ─────────────────────────────── */}
      <MappingEditorDrawer
        open={drawerOpen}
        templateId={id}
        editField={editField}
        draft={draft}
        existingFields={fields ?? []}
        onClose={() => {
          setDrawerOpen(false);
          setEditField(null);
          setDraft(null);
        }}
        onSaved={handleSaved}
        onError={handleError}
      />
    </div>
  );
}
