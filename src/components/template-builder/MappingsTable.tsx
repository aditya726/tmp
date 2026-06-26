import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import type { FieldMappingDto } from '../../types/api';
import { templatesApi } from '../../api/templatesApi';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Spinner } from '../ui/Spinner';

interface MappingsTableProps {
  templateId: number;
  fields: FieldMappingDto[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (field: FieldMappingDto) => void;
  onDeleted: (header: string) => void;
  onDeleteError: (msg: string) => void;
}

function XPathCell({ xpath }: { xpath: string }) {
  const [expanded, setExpanded] = useState(false);
  const short = xpath.length > 40 ? xpath.slice(0, 40) + '…' : xpath;
  return (
    <div className="group relative">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-left font-mono text-[11px] text-blue-600 hover:text-blue-800 transition-colors"
        title={xpath}
      >
        {expanded ? xpath : short}
      </button>
    </div>
  );
}

export function MappingsTable({
  templateId,
  fields,
  isLoading,
  onAddNew,
  onEdit,
  onDeleted,
  onDeleteError,
}: MappingsTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FieldMappingDto | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (field: FieldMappingDto) =>
      templatesApi.deleteField(templateId, field.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', templateId] });
      onDeleted(deleteTarget?.csvHeader ?? 'Field');
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      onDeleteError(err.message);
      setDeleteTarget(null);
    },
  });

  const filtered = fields.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.csvHeader.toLowerCase().includes(q) ||
      f.extractionKey.toLowerCase().includes(q) ||
      f.xpathExpr?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => a.columnOrder - b.columnOrder);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter mappings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-8 text-xs py-1.5"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={12} />
          {sorted.length}/{fields.length}
        </div>
        <button onClick={onAddNew} id="add-mapping-btn" className="btn-primary text-xs py-1.5">
          <Plus size={14} />
          Add Custom Field
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ArrowUpDown size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No mappings found</p>
            <p className="text-xs text-slate-400 mb-4">
              {search ? `No mappings match "${search}".` : 'Add your first field mapping to get started.'}
            </p>
            {!search && (
              <button onClick={onAddNew} className="btn-primary text-xs">
                <Plus size={14} /> Add First Mapping
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="table-th w-12">#</th>
                <th className="table-th">CSV Header</th>
                <th className="table-th">Extraction Key</th>
                <th className="table-th">XPath</th>
                <th className="table-th">Transform</th>
                <th className="table-th w-20">Type</th>
                <th className="table-th w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((field) => (
                <tr
                  key={field.id}
                  className="hover:bg-blue-50/30 transition-colors duration-100 animate-fade-in"
                >
                  <td className="table-td text-slate-400 text-xs font-mono">
                    {field.columnOrder}
                  </td>
                  <td className="table-td">
                    <span className="font-semibold text-slate-900 text-xs">{field.csvHeader}</span>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs text-slate-600">{field.extractionKey}</span>
                  </td>
                  <td className="table-td max-w-[200px]">
                    <XPathCell xpath={field.xpathExpr} />
                  </td>
                  <td className="table-td">
                    <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                      {field.transformFn}
                    </span>
                  </td>
                  <td className="table-td">
                    {field.internal ? (
                      <StatusBadge variant="internal" />
                    ) : (
                      <StatusBadge variant="output" />
                    )}
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(field)}
                        title="Edit mapping"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(field)}
                        title="Delete mapping"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete mapping "${deleteTarget?.csvHeader}"?`}
        message="This will permanently remove this field mapping from the template. This action cannot be undone."
        confirmLabel="Delete Mapping"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
