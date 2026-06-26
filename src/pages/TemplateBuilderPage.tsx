import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle,
  Layers,
  Database,
  Code2,
  FileCode2,
  AlertCircle,
  ChevronRight,
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

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: 'Select Field', desc: 'From catalogue or XML' },
    { label: 'Save Mapping', desc: 'Configure and save' },
    { label: 'Preview Output', desc: 'Validate extraction' },
  ];
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <span key={i} className="flex items-center">
          <span className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                i < currentStep
                  ? 'bg-green-500 text-white'
                  : i === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i < currentStep ? <CheckCircle size={10} /> : i + 1}
            </span>
            <span className="hidden lg:block">
              <span
                className={`text-[10px] font-semibold leading-none block ${
                  i === currentStep ? 'text-blue-700' : i < currentStep ? 'text-green-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5 block">{step.desc}</span>
            </span>
          </span>
          {i < steps.length - 1 && (
            <ChevronRight size={12} className="text-slate-300 mx-1 shrink-0" />
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
          <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-1">Failed to load template</h3>
          <p className="text-sm text-slate-500 mb-4">{(templateErr as Error)?.message}</p>
          <button onClick={() => navigate('/templates')} className="btn-secondary">
            <ArrowLeft size={14} /> Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const sourceType = template?.bcmlOrGmt || 'BCML';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top header bar ─────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 z-20">
        <div className="flex items-center gap-4">
          {/* Back + name */}
          <button
            onClick={() => navigate('/templates')}
            className="btn-ghost text-xs shrink-0"
          >
            <ArrowLeft size={14} />
            Templates
          </button>

          <div className="h-5 w-px bg-slate-200 shrink-0" />

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <FileCode2 size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 truncate">{template?.name}</h1>
                <SourceTypeBadge sourceType={sourceType} />
                {template?.version !== undefined && (
                  <StatusBadge variant="version" label={`v${template.version}`} />
                )}
                {template?.active !== undefined && (
                  <StatusBadge variant={template.active ? 'active' : 'inactive'} />
                )}
              </div>
              {template?.description && (
                <p className="text-[11px] text-slate-500 truncate">{template.description}</p>
              )}
            </div>
          </div>

          {/* Step indicator */}
          <div className="shrink-0 hidden xl:block">
            <StepIndicator currentStep={currentStep} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetchFields()}
              disabled={fieldsFetching}
              className="btn-ghost text-xs"
              title="Refresh mappings"
            >
              <RefreshCw size={13} className={fieldsFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setRightTab('preview')}
              className={`btn-primary text-xs ${rightTab === 'preview' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
            >
              <Eye size={13} />
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* ── Main two-panel content ──────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ─ Field Discovery ──────── */}
        <div className="w-80 xl:w-96 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button
              onClick={() => setLeftTab('catalogue')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                leftTab === 'catalogue'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Database size={13} />
              Catalogue
            </button>
            <button
              onClick={() => setLeftTab('xml')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                leftTab === 'xml'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Code2 size={13} />
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
          <div className="flex items-center border-b border-slate-200 bg-white px-4 shrink-0">
            <button
              onClick={() => setRightTab('mappings')}
              className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold transition-colors border-b-2 ${
                rightTab === 'mappings'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers size={13} />
              Field Mappings
              {fields && (
                <span className="ml-1 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {fields.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRightTab('preview')}
              className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold transition-colors border-b-2 ${
                rightTab === 'preview'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye size={13} />
              Preview Output
            </button>

            {/* Microcopy hint */}
            <p className="ml-auto text-[10px] text-slate-400 hidden lg:block">
              {leftTab === 'catalogue'
                ? 'Known fields are reusable mappings discovered from existing templates'
                : 'Preview validates extraction before production execution'}
            </p>
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
