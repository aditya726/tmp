import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Eye,
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

function PreviewRow({ header, value }: { header: string; value: string }) {
  const isEmpty = !value || value.trim() === '';
  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors ${
        isEmpty ? 'bg-amber-50/30' : ''
      }`}
    >
      <div className="w-5/12 shrink-0">
        <span className="text-xs font-semibold text-slate-700">{header}</span>
      </div>
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-amber-500 shrink-0" />
            <span className="text-xs text-amber-600 italic">Blank</span>
          </div>
        ) : (
          <span className="text-xs font-mono text-slate-900 break-all">{value}</span>
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
      <div className="px-5 pt-4 pb-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={15} className="text-teal-600" />
          <span className="text-sm font-bold text-slate-900">Preview Output</span>
          <span className="ml-auto text-xs text-slate-400">
            {templateName} — Validates extraction from sample XML
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <FileCode2
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={xmlFileName}
              onChange={(e) => setXmlFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && previewMutation.mutate()}
              className="input-base pl-8 text-xs py-1.5 font-mono"
              placeholder="XML filename"
            />
          </div>
          <button
            id="run-preview-btn"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending || !xmlFileName.trim()}
            className="btn-primary text-xs py-1.5 shrink-0"
          >
            {previewMutation.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Play size={13} />
            )}
            {previewMutation.isPending ? 'Running…' : 'Run Preview'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!result && !previewError && !previewMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Eye size={24} className="text-teal-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Preview Your Mappings</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Run a preview to validate that your field mappings correctly extract values from the sample XML file.
            </p>
          </div>
        )}

        {previewMutation.isPending && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-teal-500 animate-spin" />
              <p className="text-xs text-slate-500">Extracting values…</p>
            </div>
          </div>
        )}

        {previewError && (
          <div className="m-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800">Preview Failed</p>
                <p className="text-xs text-red-600 mt-1">{previewError}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            {/* Summary bar */}
            <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-green-50 border-b border-teal-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-teal-800">
                  Preview Complete — {result.templateName}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="text-[11px] text-teal-700">
                  <span className="font-semibold">{result.rows.length}</span> total columns
                </span>
                <span className="text-[11px] text-green-700">
                  <span className="font-semibold">{outputCount}</span> with values
                </span>
                {blankCount > 0 && (
                  <span className="text-[11px] text-amber-700">
                    <span className="font-semibold">{blankCount}</span> blank
                  </span>
                )}
              </div>
            </div>

            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
              <div className="w-5/12 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Header
              </div>
              <div className="flex-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                Extracted Value
              </div>
            </div>

            {/* Rows */}
            <div>
              {result.rows.map((row, i) => (
                <PreviewRow key={`${row.header}-${i}`} header={row.header} value={row.value} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
