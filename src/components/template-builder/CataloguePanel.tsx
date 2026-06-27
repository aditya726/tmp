import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Database, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { xmlApi } from '../../api/xmlApi';
import type { XmlFieldCatalogueDto, FieldMappingDto } from '../../types/api';
import { useDebounce } from '../../hooks/useDebounce';

interface CataloguePanelProps {
  sourceType: string;
  onSelectField: (draft: Partial<FieldMappingDto>) => void;
  selectedXPath?: string;
}

function CatalogueItem({
  item,
  isSelected,
  onSelect,
}: {
  item: XmlFieldCatalogueDto;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-2.5 rounded border transition-colors duration-100 group ${
        isSelected
          ? 'bg-blue-50/60 border-blue-300'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <span className="text-[12px] font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
          {item.displayName}
        </span>
        <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-1 py-0.5 rounded font-mono shrink-0">
          {item.defaultTransformFn}
        </span>
      </div>
      <p className="text-[10px] font-mono text-blue-600 truncate mb-0.5" title={item.xpathExpr}>
        {item.xpathExpr.length > 44 ? '…' + item.xpathExpr.slice(-44) : item.xpathExpr}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Key: {item.extractionKey}</span>
        {item.sampleValue && (
          <span className="text-[10px] text-emerald-600 truncate">
            → {item.sampleValue}
          </span>
        )}
      </div>
      {item.description && (
        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
      )}
    </button>
  );
}

export function CataloguePanel({ sourceType, onSelectField, selectedXPath }: CataloguePanelProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['xml-fields', sourceType, debouncedSearch],
    queryFn: () => xmlApi.searchXmlFields(sourceType, debouncedSearch),
    enabled: true,
    staleTime: 30_000,
  });

  const handleSelect = (item: XmlFieldCatalogueDto) => {
    setSelectedId(item.id);
    onSelectField({
      csvHeader: item.displayName,
      extractionKey: item.extractionKey,
      xpathExpr: item.xpathExpr,
      dataType: item.dataType || 'STRING',
      transformFn: item.defaultTransformFn || 'PASSTHROUGH',
      transformParams: null,
      internal: false,
      nullDefault: '',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-3 pt-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Database size={12} className="text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">Field Catalogue</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search fields…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-7 text-[11px] py-1"
          />
        </div>
        {data && (
          <p className="text-[10px] text-slate-400 mt-1">
            {data.length} fields for {sourceType}
          </p>
        )}
      </div>

      {/* Selected XPath indicator */}
      {selectedXPath && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded border border-blue-200 bg-blue-50/60 flex items-start gap-1.5">
          <Wand2 size={10} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-blue-700">Selected</p>
            <p className="text-[10px] font-mono text-blue-600 truncate" title={selectedXPath}>
              {selectedXPath}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="text-slate-400 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle size={16} className="text-red-400 mb-2" />
            <p className="text-[12px] text-slate-500">{(error as Error)?.message}</p>
          </div>
        ) : data?.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-[12px] text-slate-400">No fields match your search.</p>
          </div>
        ) : (
          data?.map((item) => (
            <CatalogueItem
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={() => handleSelect(item)}
            />
          ))
        )}
      </div>

      {/* Help microcopy */}
      <div className="px-3 py-1.5 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Click a field to autofill the mapping editor
        </p>
      </div>
    </div>
  );
}
