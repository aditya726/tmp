import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { XmlInspectNodeDto } from '../../types/api';

interface XmlTreeNodeProps {
  node: XmlInspectNodeDto;
  depth?: number;
  onSelectNode: (node: XmlInspectNodeDto) => void;
  selectedXPath?: string;
}

/**
 * A node is "meaningful" (selectable for XPath extraction) if:
 * - It has a non-empty sampleValue, OR
 * - It is a leaf node (no children) — these are text-content elements
 */
function isMeaningfulNode(node: XmlInspectNodeDto): boolean {
  if (node.sampleValue && node.sampleValue.trim() !== '') return true;
  if (!node.children || node.children.length === 0) return true;
  return false;
}

export function XmlTreeNode({ node, depth = 0, onSelectNode, selectedXPath }: XmlTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedXPath === node.xpathExpr;
  const isAttribute = node.nodeType === 'ATTRIBUTE';
  const meaningful = isMeaningfulNode(node);
  const indent = 8 + depth * 16;

  const handleClick = () => {
    if (hasChildren) setExpanded((e) => !e);
    // Only fire selection for meaningful nodes
    if (meaningful) {
      onSelectNode(node);
    }
  };

  return (
    <div className="xml-node">
      <div
        className={`flex items-center gap-1 py-[3px] px-2 rounded-sm transition-colors duration-75 ${
          meaningful ? 'xml-node-selectable' : 'xml-node-container'
        } ${
          isSelected
            ? 'bg-blue-50 border-l-2 border-l-blue-500'
            : meaningful
            ? 'hover:bg-slate-50'
            : ''
        }`}
        style={{
          paddingLeft: `${isSelected ? indent - 2 : indent}px`,
          ['--node-indent' as string]: `${indent}px`,
        }}
        onClick={handleClick}
      >
        {/* Expand arrow */}
        <span className="shrink-0 w-3.5 flex items-center justify-center text-slate-400">
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={11} />
            ) : (
              <ChevronRight size={11} />
            )
          ) : (
            <span className="w-2.5 h-px bg-slate-200 inline-block" />
          )}
        </span>

        {/* Element name */}
        <span
          className={`text-[11px] font-mono font-medium ${
            isAttribute
              ? 'text-amber-700'
              : meaningful
              ? isSelected ? 'text-blue-800' : 'text-blue-700'
              : 'text-slate-500'
          }`}
        >
          {isAttribute ? `@${node.elementName}` : node.elementName}
        </span>

        {/* Sample value — only for meaningful nodes */}
        {node.sampleValue && node.sampleValue.trim() !== '' && (
          <span className="text-[10px] text-emerald-600 font-mono ml-1 truncate max-w-[100px]" title={node.sampleValue}>
            = &quot;{node.sampleValue}&quot;
          </span>
        )}

        {/* Data type badge */}
        {meaningful && node.dataType && node.dataType !== 'STRING' && (
          <span className="ml-auto text-[9px] bg-slate-100 text-slate-500 px-1 rounded shrink-0">
            {node.dataType}
          </span>
        )}
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
