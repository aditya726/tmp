import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode2, Tag } from 'lucide-react';
import type { XmlInspectNodeDto } from '../../types/api';

interface XmlTreeNodeProps {
  node: XmlInspectNodeDto;
  depth?: number;
  onSelectNode: (node: XmlInspectNodeDto) => void;
  selectedXPath?: string;
}

export function XmlTreeNode({ node, depth = 0, onSelectNode, selectedXPath }: XmlTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedXPath === node.xpathExpr;
  const isAttribute = node.nodeType === 'ATTRIBUTE';

  return (
    <div className="xml-node">
      <div
        className={`flex items-center gap-1 py-0.5 px-2 rounded cursor-pointer transition-colors duration-100 group ${
          isSelected
            ? 'bg-blue-100 text-blue-900'
            : 'hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (hasChildren) setExpanded((e) => !e);
          onSelectNode(node);
        }}
      >
        {/* Expand arrow */}
        <span className="shrink-0 w-4 flex items-center justify-center text-slate-400">
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )
          ) : (
            <span className="w-3 h-px bg-slate-200 ml-1 inline-block" />
          )}
        </span>

        {/* Node icon */}
        <span className={`shrink-0 ${isAttribute ? 'text-amber-500' : 'text-blue-500'}`}>
          {isAttribute ? <Tag size={11} /> : <FileCode2 size={11} />}
        </span>

        {/* Element name */}
        <span
          className={`text-[11px] font-mono font-semibold ${
            isAttribute ? 'text-amber-700' : isSelected ? 'text-blue-800' : 'text-blue-700'
          }`}
        >
          {isAttribute ? `@${node.elementName}` : node.elementName}
        </span>

        {/* Sample value */}
        {node.sampleValue && (
          <span className="text-[10px] text-green-600 font-mono ml-1 truncate max-w-[80px]" title={node.sampleValue}>
            = &quot;{node.sampleValue}&quot;
          </span>
        )}

        {/* Data type badge */}
        {node.dataType && node.dataType !== 'STRING' && (
          <span className="ml-auto text-[9px] bg-slate-100 text-slate-500 px-1 rounded shrink-0">
            {node.dataType}
          </span>
        )}

        {/* XPath on hover */}
        <span
          className="ml-1 text-[9px] text-slate-400 font-mono truncate max-w-[120px] opacity-0 group-hover:opacity-100 transition-opacity"
          title={node.xpathExpr}
        >
          {node.xpathExpr}
        </span>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child, i) => (
            <XmlTreeNode
              key={`${child.xpathExpr}-${i}`}
              node={child}
              depth={depth + 1}
              onSelectNode={onSelectNode}
              selectedXPath={selectedXPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
