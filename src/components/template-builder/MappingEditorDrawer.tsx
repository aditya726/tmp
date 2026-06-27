import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  Wand2,
} from 'lucide-react';
import type { FieldMappingDto } from '../../types/api';
import { TRANSFORM_FUNCTIONS, DATA_TYPES } from '../../types/api';
import { templatesApi } from '../../api/templatesApi';
import { Spinner } from '../ui/Spinner';

const schema = z.object({
  csvHeader: z.string().min(1, 'CSV Header is required'),
  extractionKey: z.string().min(1, 'Extraction Key is required'),
  xpathExpr: z.string().min(1, 'XPath Expression is required'),
  transformFn: z.string().min(1),
  dataType: z.string().min(1),
  transformParams: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Must be valid JSON'),
  internal: z.boolean(),
  nullDefault: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface MappingEditorDrawerProps {
  open: boolean;
  templateId: number;
  editField?: FieldMappingDto | null;
  draft?: Partial<FieldMappingDto> | null;
  existingFields?: FieldMappingDto[];
  onClose: () => void;
  onSaved: (action: 'created' | 'updated', header: string) => void;
  onError: (msg: string) => void;
}

const defaultValues: FormValues = {
  csvHeader: '',
  extractionKey: '',
  xpathExpr: '',
  transformFn: 'PASSTHROUGH',
  dataType: 'STRING',
  transformParams: null,
  internal: false,
  nullDefault: '',
};

function FormField({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-base">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function MappingEditorDrawer({
  open,
  templateId,
  editField,
  draft,
  existingFields = [],
  onClose,
  onSaved,
  onError,
}: MappingEditorDrawerProps) {
  const queryClient = useQueryClient();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEdit = !!editField;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Populate form when editField or draft changes
  useEffect(() => {
    if (!open) return;
    if (editField) {
      reset({
        csvHeader: editField.csvHeader,
        extractionKey: editField.extractionKey,
        xpathExpr: editField.xpathExpr,
        transformFn: editField.transformFn || 'PASSTHROUGH',
        dataType: editField.dataType || 'STRING',
        transformParams: editField.transformParams ?? null,
        internal: editField.internal ?? false,
        nullDefault: editField.nullDefault ?? '',
      });
    } else if (draft) {
      reset({
        ...defaultValues,
        csvHeader: draft.csvHeader || '',
        extractionKey: draft.extractionKey || '',
        xpathExpr: draft.xpathExpr || '',
        transformFn: draft.transformFn || 'PASSTHROUGH',
        dataType: draft.dataType || 'STRING',
        transformParams: draft.transformParams ?? null,
        internal: draft.internal ?? false,
        nullDefault: draft.nullDefault ?? '',
      });
    } else {
      reset(defaultValues);
    }
  }, [open, editField, draft, reset]);

  // Auto-calculate column order
  const getColumnOrder = (): number => {
    if (isEdit && editField) return editField.columnOrder;
    if (existingFields.length === 0) return 10;
    const maxOrder = Math.max(...existingFields.map((f) => f.columnOrder));
    return maxOrder + 10;
  };

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      templatesApi.createField(templateId, {
        ...data,
        columnOrder: getColumnOrder(),
        transformParams: data.transformParams || null,
      }),
    onSuccess: (_result, data) => {
      queryClient.invalidateQueries({ queryKey: ['fields', templateId] });
      onSaved('created', data.csvHeader);
      onClose();
    },
    onError: (err: Error) => onError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) =>
      templatesApi.updateField(templateId, editField!.id!, {
        ...data,
        columnOrder: getColumnOrder(),
        transformParams: data.transformParams || null,
      }),
    onSuccess: (_result, data) => {
      queryClient.invalidateQueries({ queryKey: ['fields', templateId] });
      onSaved('updated', data.csvHeader);
      onClose();
    },
    onError: (err: Error) => onError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="drawer-panel w-[440px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900">
              {isEdit ? 'Edit Mapping' : 'New Mapping'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isEdit ? `Updating "${editField?.csvHeader}"` : 'Configure field extraction'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form id="mapping-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3.5">
            {/* Draft badge */}
            {draft && !isEdit && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-blue-200 bg-blue-50/60">
                <Wand2 size={11} className="text-blue-600 shrink-0" />
                <p className="text-[11px] text-blue-700">
                  Pre-filled from selected field. Review and save.
                </p>
              </div>
            )}

            <FormField label="CSV Header" required error={errors.csvHeader?.message}>
              <input
                {...register('csvHeader')}
                className={`input-base ${errors.csvHeader ? 'input-error' : ''}`}
                placeholder="e.g. TradeId"
              />
            </FormField>

            <FormField label="Extraction Key" required error={errors.extractionKey?.message}
              hint="Internal key used to reference this field">
              <input
                {...register('extractionKey')}
                className={`input-base font-mono ${errors.extractionKey ? 'input-error' : ''}`}
                placeholder="e.g. TradeId"
              />
            </FormField>

            <FormField label="XPath Expression" required error={errors.xpathExpr?.message}
              hint="Full XPath to extract the value from XML">
              <textarea
                {...register('xpathExpr')}
                rows={2}
                className={`input-base font-mono text-[11px] resize-none ${errors.xpathExpr ? 'input-error' : ''}`}
                placeholder="/BCTrade/trade/tradeHeader/tradeId/id/text()"
              />
            </FormField>

            <FormField label="Transform Function" required error={errors.transformFn?.message}>
              <select {...register('transformFn')} className="input-base">
                {TRANSFORM_FUNCTIONS.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Advanced section */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left"
              >
                <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                  <Info size={11} />
                  Advanced Settings
                </span>
                {showAdvanced ? (
                  <ChevronUp size={12} className="text-slate-400" />
                ) : (
                  <ChevronDown size={12} className="text-slate-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="px-3 py-3 space-y-3 border-t border-slate-200 animate-slide-in-up">
                  <FormField label="Data Type" error={errors.dataType?.message}>
                    <select {...register('dataType')} className="input-base">
                      {DATA_TYPES.map((dt) => (
                        <option key={dt} value={dt}>
                          {dt}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Transform Params (JSON)"
                    error={errors.transformParams?.message}
                    hint='Must be valid JSON, e.g. {"sep":","}'
                  >
                    <textarea
                      {...register('transformParams')}
                      rows={2}
                      className={`input-base font-mono text-[11px] resize-none ${errors.transformParams ? 'input-error' : ''}`}
                      placeholder='{"key": "value"}'
                    />
                  </FormField>

                  <FormField label="Null Default" hint="Value when field is empty">
                    <input
                      {...register('nullDefault')}
                      className="input-base"
                      placeholder="Leave blank for empty string"
                    />
                  </FormField>

                  <div className="flex items-center justify-between p-2.5 rounded bg-amber-50/60 border border-amber-200">
                    <div>
                      <p className="text-[12px] font-medium text-amber-900">Internal</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Not included in CSV output
                      </p>
                    </div>
                    <Controller
                      name="internal"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                            field.value ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                              field.value ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={() => reset(defaultValues)}
            className="btn-ghost text-[12px]"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-[12px]">
              Cancel
            </button>
            <button
              type="submit"
              form="mapping-form"
              disabled={isPending}
              className="btn-primary text-[12px]"
            >
              {isPending ? (
                <>
                  <Spinner size="sm" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={12} />
                  {isEdit ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
