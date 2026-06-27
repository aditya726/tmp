import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Play,
  AlertTriangle,
  CheckCircle,
  FileCode2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { templatesApi } from '../../api/templatesApi';
import type { PreviewResponse } from '../../types/api';

interface PreviewPanelProps {
  templateId: number;
  templateName: string;
}

function PreviewRow({ header, value, index }: { header: string; value: string; index: number }) {
  const isEmpty = !value || value.trim() === '';
  return (
    <div
      className={`flex items-start gap-3 px-4 py-2 border-b border-slate-100 last:border-0 ${
        isEmpty ? 'bg-amber-50/30' : ''
      }`}
    >
      <div className="w-5/12 shrink-0 flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono w-4 text-right shrink-0">{index + 1}</span>
        <span className="text-[12px] font-medium text-slate-700">{header}</span>
      </div>
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <span className="text-[11px] text-amber-500 flex items-center gap-1">
            <AlertTriangle size={10} className="shrink-0" />
            blank
          </span>
        ) : (
          <span className="text-[12px] font-mono text-slate-800 break-all">{value}</span>
        )}
      </div>
    </div>
  );
}

export function PreviewPanel({ templateId, templateName }: PreviewPanelProps) {
  const [xmlFileName, setXmlFileName] = useState('ems0043d0ad_v25.xml');
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: () => templatesApi.previewTemplate(templateId, xmlFileName),
    onSuccess: (data) => {
      setResult(data);
      setPreviewError(null);
    },
    onError: (err: Error) => {
      setPreviewError(err.message);
      setResult(null);
    },
  });

  const blankCount = result?.rows.filter((r) => !r.value || r.value.trim() === '').length ?? 0;
  const outputCount = result?.rows.filter((r) => r.value && r.value.trim() !== '').length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FileCode2
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={xmlFileName}
              onChange={(e) => setXmlFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && previewMutation.mutate()}
              className="input-base pl-7 text-[12px] py-1 font-mono"
              placeholder="XML filename"
            />
          </div>
          <button
            id="run-preview-btn"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending || !xmlFileName.trim()}
            className="btn-primary text-[12px] py-1 shrink-0"
          >
            {previewMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Play size={12} />
            )}
            {previewMutation.isPending ? 'Running…' : 'Run Preview'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!result && !previewError && !previewMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <p className="text-[13px] text-slate-500 mb-1">Preview Your Mappings</p>
            <p className="text-[12px] text-slate-400 max-w-xs leading-relaxed">
              Run a preview to validate that your field mappings correctly extract values from the sample XML.
            </p>
          </div>
        )}

        {previewMutation.isPending && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-slate-400 animate-spin" />
              <p className="text-[12px] text-slate-500">Extracting values…</p>
            </div>
          </div>
        )}

        {previewError && (
          <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-medium text-red-800">Preview Failed</p>
                <p className="text-[11px] text-red-600 mt-0.5">{previewError}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            {/* Report header */}
            <div className="report-header">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-600" />
                  <span className="text-[13px] font-semibold text-slate-800">
                    {result.templateName}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date().toLocaleString()}
                </span>
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className="text-slate-600">
                  <span className="font-medium text-slate-800">{result.rows.length}</span> columns
                </span>
                <span className="text-emerald-700">
                  <span className="font-medium">{outputCount}</span> with values
                </span>
                {blankCount > 0 && (
                  <span className="text-amber-600">
                    <span className="font-medium">{blankCount}</span> blank
                  </span>
                )}
              </div>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-slate-200">
              <div className="w-5/12 text-[10px] font-medium text-slate-500 uppercase tracking-wide pl-6">
                Header
              </div>
              <div className="flex-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                Extracted Value
              </div>
            </div>

            {/* Rows */}
            <div>
              {result.rows.map((row, i) => (
                <PreviewRow key={`${row.header}-${i}`} header={row.header} value={row.value} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
