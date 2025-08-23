import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Node, nodeAPI, NodeConnection } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface NodesManagerProps {
  appId: string;
  onRefresh: () => void;
  selectedNodeIds: Set<string>;
}

export function NodesManager({ appId, onRefresh, selectedNodeIds }: NodesManagerProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [newNodeNames, setNewNodeNames] = useState('');
  const [editName, setEditName] = useState('');
  const [connections, setConnections] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load nodes when component mounts
  const loadNodes = async () => {
    try {
      const nodeList = await nodeAPI.getByApp(appId);
      setNodes(nodeList);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load nodes.",
        variant: "destructive",
      });
    }
  };

  // Load nodes on mount and when appId changes
  useEffect(() => {
    loadNodes();
  }, [appId]);

  const refreshAndReload = () => {
    onRefresh();
    loadNodes();
  };

  const handleAddNodes = async () => {
    const names = newNodeNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (names.length === 0) return;

    setIsLoading(true);
    try {
      await nodeAPI.add(appId, names);
      toast({
        title: "Nodes added",
        description: `Successfully added ${names.length} node(s).`,
      });
      setIsAddDialogOpen(false);
      setNewNodeNames('');
      refreshAndReload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add nodes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNode = async () => {
    if (!editingNode || !editName.trim()) return;

    setIsLoading(true);
    try {
      await nodeAPI.edit(appId, editingNode.nodeId, editName.trim());
      toast({
        title: "Node updated",
        description: `Successfully updated "${editingNode.name}" to "${editName.trim()}".`,
      });
      setIsEditDialogOpen(false);
      setEditingNode(null);
      setEditName('');
      refreshAndReload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNode = async (node: Node) => {
    setIsLoading(true);
    try {
      await nodeAPI.delete(appId, node.nodeId);
      toast({
        title: "Node deleted",
        description: `Successfully deleted "${node.name}".`,
      });
      refreshAndReload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectNodes = async () => {
    try {
      const connectionList: NodeConnection[] = connections
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const [nodeId, parentId] = line.split(',').map(s => s.trim());
          return { nodeId, parentId };
        });

      if (connectionList.length === 0) return;

      setIsLoading(true);
      await nodeAPI.connect(appId, connectionList);
      toast({
        title: "Nodes connected",
        description: `Successfully connected ${connectionList.length} node(s).`,
      });
      setIsConnectDialogOpen(false);
      setConnections('');
      refreshAndReload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect nodes. Check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (node: Node) => {
    setEditingNode(node);
    setEditName(node.name);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <Card className="bg-gradient-subtle border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Node Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Nodes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Nodes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nodeNames">Node Names (one per line)</Label>
                  <Textarea
                    id="nodeNames"
                    value={newNodeNames}
                    onChange={(e) => setNewNodeNames(e.target.value)}
                    placeholder="Widget 1&#10;Widget 2&#10;Component A"
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNodes} disabled={isLoading || !newNodeNames.trim()}>
                  {isLoading ? "Adding..." : "Add Nodes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect Nodes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Nodes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="connections">Connections (nodeId,parentId per line)</Label>
                  <Textarea
                    id="connections"
                    value={connections}
                    onChange={(e) => setConnections(e.target.value)}
                    placeholder="2,1&#10;3,1&#10;4,2"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: nodeId,parentId (one connection per line)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConnectNodes} disabled={isLoading || !connections.trim()}>
                  {isLoading ? "Connecting..." : "Connect Nodes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedNodeIds.size > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {selectedNodeIds.size} selected
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Nodes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Nodes ({nodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {nodes.length > 0 ? (
            <div className="space-y-2">
              {nodes.map((node) => (
                 <div
                  key={node.nodeId}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedNodeIds.has(node.nodeId) ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div>
                    <span className="font-medium">{node.name}</span>
                    <div className="text-sm text-muted-foreground">
                      ID: {node.nodeId}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(node)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Node</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{node.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteNode(node)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No nodes created yet. Add your first node to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Node Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter node name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditNode} disabled={isLoading || !editName.trim()}>
              {isLoading ? "Updating..." : "Update Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}