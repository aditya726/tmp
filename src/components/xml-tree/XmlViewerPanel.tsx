import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, Code2 } from 'lucide-react';
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
      <div className="px-3 pt-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Code2 size={12} className="text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">XML Viewer</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="XML filename…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            className="input-base text-[11px] py-1 flex-1 font-mono"
          />
          <button
            onClick={handleLoad}
            disabled={isFetching || !inputValue.trim()}
            className="btn-secondary text-[11px] py-1 px-2.5 shrink-0"
          >
            {isFetching ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Load
          </button>
        </div>
        {tree && (
          <p className="text-[10px] text-slate-400 mt-1">
            <span className="font-mono">{xmlFileName}</span>
          </p>
        )}
      </div>

      {/* Selected node info — only shown when a meaningful node is selected */}
      {selectedXPath && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded border border-blue-200 bg-blue-50/60">
          <p className="text-[10px] font-medium text-blue-700 mb-0.5">Selected XPath</p>
          <p
            className="text-[10px] font-mono text-blue-600 break-all leading-relaxed"
            title={selectedXPath}
          >
            {selectedXPath}
          </p>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="text-slate-400 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-8 text-center px-4">
            <AlertCircle size={16} className="text-red-400 mb-2" />
            <p className="text-[12px] text-slate-500 mb-2">{(error as Error)?.message}</p>
            <button onClick={() => refetch()} className="btn-secondary text-[11px]">
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        ) : !tree ? (
          <div className="flex flex-col items-center py-8 text-center px-4">
            <p className="text-[12px] text-slate-400">Enter a filename and click Load.</p>
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
      <div className="px-3 py-1.5 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Click a value-bearing element to capture its XPath
        </p>
      </div>
    </div>
  );
}
