import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileCode2, Loader2, AlertCircle, RefreshCw, Code2, Info } from 'lucide-react';
import { xmlApi } from '../../api/xmlApi';
import type { XmlInspectNodeDto, FieldMappingDto } from '../../types/api';
import { XmlTreeNode } from './XmlTreeNode';

interface XmlViewerPanelProps {
  onSelectNode: (draft: Partial<FieldMappingDto>) => void;
}

export function XmlViewerPanel({ onSelectNode }: XmlViewerPanelProps) {
  const [xmlFileName, setXmlFileName] = useState('ems0043d0ad_v25.xml');
  const [inputValue, setInputValue] = useState('ems0043d0ad_v25.xml');
  const [selectedXPath, setSelectedXPath] = useState<string | undefined>();

  const {
    data: tree,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['xml-inspect', xmlFileName],
    queryFn: () => xmlApi.inspectXml(xmlFileName),
    enabled: !!xmlFileName,
    retry: 1,
  });

  const handleNodeSelect = (node: XmlInspectNodeDto) => {
    setSelectedXPath(node.xpathExpr);
    onSelectNode({
      csvHeader: node.suggestedExtractionKey,
      extractionKey: node.suggestedExtractionKey,
      xpathExpr: node.xpathExpr,
      dataType: node.dataType || 'STRING',
      transformFn: 'PASSTHROUGH',
      transformParams: null,
      internal: false,
      nullDefault: '',
    });
  };

  const handleLoad = () => {
    if (inputValue.trim()) {
      setXmlFileName(inputValue.trim());
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 pt-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-2.5">
          <Code2 size={14} className="text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700">XML Viewer</span>
          <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
            <Info size={10} />
            Inspect sample XML
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="XML filename…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            className="input-base text-xs py-1.5 flex-1 font-mono"
          />
          <button
            onClick={handleLoad}
            disabled={isFetching || !inputValue.trim()}
            className="btn-secondary text-xs py-1.5 px-3 shrink-0"
          >
            {isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Load
          </button>
        </div>
        {tree && (
          <p className="text-[10px] text-slate-400 mt-1.5">
            Loaded: <span className="font-mono">{xmlFileName}</span>
          </p>
        )}
      </div>

      {/* Selected node info */}
      {selectedXPath && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
          <p className="text-[10px] font-semibold text-indigo-700">Selected XPath</p>
          <p
            className="text-[10px] font-mono text-indigo-600 break-all"
            title={selectedXPath}
          >
            {selectedXPath}
          </p>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-indigo-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-8 text-center px-4">
            <AlertCircle size={20} className="text-red-400 mb-2" />
            <p className="text-xs text-slate-500 mb-3">{(error as Error)?.message}</p>
            <button onClick={() => refetch()} className="btn-secondary text-xs">
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : !tree ? (
          <div className="flex flex-col items-center py-8 text-center px-4">
            <FileCode2 size={24} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Enter a filename and click Load to inspect XML.</p>
          </div>
        ) : (
          <XmlTreeNode
            node={tree}
            depth={0}
            onSelectNode={handleNodeSelect}
            selectedXPath={selectedXPath}
          />
        )}
      </div>

      {/* Help microcopy */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-400 text-center">
          Click any XML element to generate XPath ↗
        </p>
      </div>
    </div>
  );
}
