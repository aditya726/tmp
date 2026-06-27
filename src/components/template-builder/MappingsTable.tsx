import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  ArrowUpDown,
  GripVertical,
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
    <button
      onClick={() => setExpanded((e) => !e)}
      className="text-left font-mono text-[11px] text-blue-600 hover:text-blue-700 transition-colors"
      title={xpath}
    >
      {expanded ? xpath : short}
    </button>
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

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);
  const dragCounter = useRef(0);

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

  // Reorder mutation — updates each changed field
  const reorderMutation = useMutation({
    mutationFn: async (reorderedFields: FieldMappingDto[]) => {
      const updates = reorderedFields.map((field, index) => ({
        field,
        newOrder: (index + 1) * 10,
      }));
      // Only update fields whose order actually changed
      const changed = updates.filter(({ field, newOrder }) => field.columnOrder !== newOrder);
      await Promise.all(
        changed.map(({ field, newOrder }) =>
          templatesApi.updateField(templateId, field.id!, {
            csvHeader: field.csvHeader,
            extractionKey: field.extractionKey,
            xpathExpr: field.xpathExpr,
            columnOrder: newOrder,
            transformFn: field.transformFn,
            dataType: field.dataType,
            transformParams: field.transformParams ?? null,
            internal: field.internal,
            nullDefault: field.nullDefault,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', templateId] });
    },
    onError: (err: Error) => {
      onDeleteError(`Reorder failed: ${err.message}`);
      queryClient.invalidateQueries({ queryKey: ['fields', templateId] });
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

  // --- Drag and drop handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make the drag image slightly transparent
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => target.classList.add('drag-row-dragging'), 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-row-dragging');
    setDragIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
    dragCounter.current = 0;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    if (index !== dragIndex) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
      setDragOverPosition(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index === dragIndex) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';
    setDragOverPosition(position);
    setDragOverIndex(index);
  }, [dragIndex]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      setDragOverPosition(null);
      return;
    }

    const newSorted = [...sorted];
    const [moved] = newSorted.splice(dragIndex, 1);

    // Calculate insertion index
    let insertAt = dropIndex;
    if (dragIndex < dropIndex) {
      insertAt = dragOverPosition === 'top' ? dropIndex - 1 : dropIndex;
    } else {
      insertAt = dragOverPosition === 'top' ? dropIndex : dropIndex + 1;
    }
    insertAt = Math.max(0, Math.min(insertAt, newSorted.length));
    newSorted.splice(insertAt, 0, moved);

    // Fire reorder
    reorderMutation.mutate(newSorted);

    setDragIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
    dragCounter.current = 0;
  }, [dragIndex, dragOverPosition, sorted, reorderMutation]);

  const isReordering = reorderMutation.isPending;
  const canDrag = !search; // Disable drag when filtering

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-200 bg-white shrink-0">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter mappings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-7 text-[12px] py-1"
          />
        </div>
        <span className="text-[11px] text-slate-400">
          {sorted.length}/{fields.length}
        </span>
        <button onClick={onAddNew} id="add-mapping-btn" className="btn-primary text-[12px] py-1">
          <Plus size={13} />
          Add Field
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowUpDown size={16} className="text-slate-300 mb-2" />
            <p className="text-[13px] text-slate-500 mb-1">
              {search ? `No mappings match "${search}".` : 'No mappings yet.'}
            </p>
            {!search && (
              <button onClick={onAddNew} className="btn-ghost text-[12px] mt-1">
                <Plus size={12} /> Add first mapping
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {canDrag && <th className="table-th w-8"></th>}
                <th className="table-th w-10">#</th>
                <th className="table-th">CSV Header</th>
                <th className="table-th">Extraction Key</th>
                <th className="table-th">XPath</th>
                <th className="table-th">Transform</th>
                <th className="table-th w-16">Type</th>
                <th className="table-th w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((field, index) => {
                const isDragging = dragIndex === index;
                const isOver = dragOverIndex === index && dragIndex !== index;
                let rowClass = 'transition-colors duration-75 hover:bg-slate-50/60';
                if (isDragging) rowClass += ' drag-row-dragging';
                if (isOver && dragOverPosition === 'top') rowClass += ' drag-row-over-top';
                if (isOver && dragOverPosition === 'bottom') rowClass += ' drag-row-over-bottom';

                return (
                  <tr
                    key={field.id}
                    className={rowClass}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => handleDragStart(e, index) : undefined}
                    onDragEnd={canDrag ? handleDragEnd : undefined}
                    onDragEnter={canDrag ? (e) => handleDragEnter(e, index) : undefined}
                    onDragLeave={canDrag ? handleDragLeave : undefined}
                    onDragOver={canDrag ? (e) => handleDragOver(e, index) : undefined}
                    onDrop={canDrag ? (e) => handleDrop(e, index) : undefined}
                  >
                    {canDrag && (
                      <td className="table-td">
                        <span className="drag-handle">
                          <GripVertical size={13} />
                        </span>
                      </td>
                    )}
                    <td className="table-td text-slate-400 text-[11px] font-mono">
                      {field.columnOrder}
                    </td>
                    <td className="table-td">
                      <span className="font-medium text-slate-800 text-[13px]">{field.csvHeader}</span>
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-[11px] text-slate-500">{field.extractionKey}</span>
                    </td>
                    <td className="table-td max-w-[200px]">
                      <XPathCell xpath={field.xpathExpr} />
                    </td>
                    <td className="table-td">
                      <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
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
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => onEdit(field)}
                          title="Edit"
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(field)}
                          title="Delete"
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {isReordering && (
          <div className="flex items-center justify-center py-2 bg-blue-50/50 border-t border-blue-100">
            <span className="text-[11px] text-blue-600 flex items-center gap-1.5">
              <Spinner size="sm" /> Saving order…
            </span>
          </div>
        )}
      </div>

      {/* Drag hint */}
      {canDrag && sorted.length > 1 && (
        <div className="px-3 py-1.5 border-t border-slate-100 shrink-0">
          <p className="text-[10px] text-slate-400">Drag rows to reorder columns</p>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.csvHeader}"?`}
        message="This field mapping will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
