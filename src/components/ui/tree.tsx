import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  parentId?: string;
}

interface TreeProps {
  nodes: TreeNode[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  expandedIds?: Set<string>;
  onExpandedChange?: (expandedIds: Set<string>) => void;
  multiSelect?: boolean;
  className?: string;
  smartSelection?: boolean; // New prop for smart selection logic
}

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onExpandedChange: (expandedIds: Set<string>) => void;
  multiSelect: boolean;
  allNodes: TreeNode[];
  smartSelection: boolean;
  visualSelectedIds: Set<string>;
}

function getAllDescendants(node: TreeNode): string[] {
  const descendants: string[] = [];
  
  const traverse = (current: TreeNode) => {
    descendants.push(current.id);
    current.children?.forEach(traverse);
  };
  
  traverse(node);
  return descendants;
}

function getAllChildren(node: TreeNode): string[] {
  const children: string[] = [];
  
  const traverse = (current: TreeNode) => {
    current.children?.forEach(child => {
      children.push(child.id);
      traverse(child);
    });
  };
  
  traverse(node);
  return children;
}

function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getParentNode(nodes: TreeNode[], childId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.children?.some(child => child.id === childId)) {
      return node;
    }
    if (node.children) {
      const found = getParentNode(node.children, childId);
      if (found) return found;
    }
  }
  return null;
}

function calculateVisualSelection(actualSelected: Set<string>, allNodes: TreeNode[]): Set<string> {
  const visualSelected = new Set<string>();
  
  // Add all actually selected nodes
  actualSelected.forEach(id => visualSelected.add(id));
  
  // Add children of selected nodes
  actualSelected.forEach(id => {
    const node = findNodeById(allNodes, id);
    if (node && node.children) {
      const children = getAllChildren(node);
      children.forEach(childId => visualSelected.add(childId));
    }
  });
  
  // Check if all children of any parent are selected, if so, select parent
  const checkParentSelection = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        const allChildrenSelected = node.children.every(child => visualSelected.has(child.id));
        if (allChildrenSelected && !actualSelected.has(node.id)) {
          visualSelected.add(node.id);
        }
        checkParentSelection(node.children);
      }
    });
  };
  
  checkParentSelection(allNodes);
  
  return visualSelected;
}

function TreeNodeComponent({
  node,
  level,
  selectedIds,
  expandedIds,
  onSelectionChange,
  onExpandedChange,
  multiSelect,
  allNodes,
  smartSelection,
  visualSelectedIds
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = smartSelection ? visualSelectedIds.has(node.id) : selectedIds.has(node.id);
  const isActuallySelected = selectedIds.has(node.id);

  const handleToggleExpanded = useCallback(() => {
    const newExpanded = new Set(expandedIds);
    if (isExpanded) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
    }
    onExpandedChange(newExpanded);
  }, [expandedIds, isExpanded, node.id, onExpandedChange]);

  const handleSelectionChange = useCallback((checked: boolean) => {
    const newSelected = new Set(selectedIds);
    
    if (smartSelection) {
      // Smart selection: only toggle the actual node, visual selection is calculated
      if (checked) {
        newSelected.add(node.id);
      } else {
        newSelected.delete(node.id);
        // Also remove any children that were explicitly selected
        if (hasChildren) {
          const children = getAllChildren(node);
          children.forEach(childId => newSelected.delete(childId));
        }
      }
    } else {
      // Original logic for backward compatibility
      if (checked) {
        if (hasChildren) {
          const descendants = getAllDescendants(node);
          descendants.forEach(id => newSelected.add(id));
        } else {
          newSelected.add(node.id);
        }
      } else {
        if (hasChildren) {
          const descendants = getAllDescendants(node);
          descendants.forEach(id => newSelected.delete(id));
        } else {
          newSelected.delete(node.id);
        }
      }
    }
    
    onSelectionChange(newSelected);
  }, [selectedIds, hasChildren, node, onSelectionChange, smartSelection]);

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors hover:bg-accent/50 cursor-pointer group",
          isSelected && "bg-primary/10 border border-primary/20",
          smartSelection && isActuallySelected && "bg-primary/20 border-primary/40"
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleExpanded}
            className="flex items-center justify-center w-4 h-4 rounded-sm hover:bg-accent transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        {multiSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelectionChange}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        )}
        
        <span 
          className={cn(
            "flex-1 text-sm font-medium transition-colors",
            isSelected ? "text-primary" : "text-foreground",
            smartSelection && isActuallySelected && "font-semibold"
          )}
          onClick={() => !multiSelect && handleSelectionChange(!isSelected)}
        >
          {node.name}
          {smartSelection && isActuallySelected && <span className="text-xs ml-1 opacity-70">(selected)</span>}
        </span>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="animate-fade-in">
          {node.children?.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onSelectionChange={onSelectionChange}
              onExpandedChange={onExpandedChange}
              multiSelect={multiSelect}
              allNodes={allNodes}
              smartSelection={smartSelection}
              visualSelectedIds={visualSelectedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Tree({
  nodes,
  selectedIds,
  onSelectionChange,
  expandedIds = new Set(),
  onExpandedChange = () => {},
  multiSelect = true,
  className,
  smartSelection = false
}: TreeProps) {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());
  
  const currentExpandedIds = expandedIds.size > 0 ? expandedIds : internalExpandedIds;
  const currentOnExpandedChange = onExpandedChange !== undefined && expandedIds.size > 0 
    ? onExpandedChange 
    : setInternalExpandedIds;

  const visualSelectedIds = smartSelection 
    ? calculateVisualSelection(selectedIds, nodes)
    : selectedIds;

  return (
    <div className={cn("space-y-1", className)}>
      {nodes.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          selectedIds={selectedIds}
          expandedIds={currentExpandedIds}
          onSelectionChange={onSelectionChange}
          onExpandedChange={currentOnExpandedChange}
          multiSelect={multiSelect}
          allNodes={nodes}
          smartSelection={smartSelection}
          visualSelectedIds={visualSelectedIds}
        />
      ))}
    </div>
  );
}