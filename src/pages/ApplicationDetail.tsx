import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TreePine, Users, Shield } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tree, TreeNode as UITreeNode } from '@/components/ui/tree';
import { NodesManager } from '@/components/NodesManager';
import { RolesPermissionsManager } from '@/components/RolesPermissionsManager';
import { Application, TreeNode as APITreeNode, applicationAPI, nodeAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function buildTreeFromAPI(apiNodes: APITreeNode[]): UITreeNode[] {
  const nodeMap = new Map<string, UITreeNode>();
  
  // Create TreeNode objects with Tree component format
  apiNodes.forEach(node => {
    nodeMap.set(node.nodeId, {
      id: node.nodeId,
      name: node.name,
      parentId: node.parentId,
      children: []
    });
  });
  
  // Build parent-child relationships
  const rootNodes: UITreeNode[] = [];
  
  nodeMap.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });
  
  return rootNodes;
}

export default function ApplicationDetail() {
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [treeNodes, setTreeNodes] = useState<UITreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadApplication = async () => {
    if (!appId) return;
    
    try {
      const [app, apiTreeNodes] = await Promise.all([
        applicationAPI.getById(appId),
        nodeAPI.getTree(appId)
      ]);
      
      setApplication(app);
      setTreeNodes(buildTreeFromAPI(apiTreeNodes));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load application data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNodes = async () => {
    if (!appId) return;
    
    try {
      const apiTreeNodes = await nodeAPI.getTree(appId);
      setTreeNodes(buildTreeFromAPI(apiTreeNodes));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh nodes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadApplication();
  }, [appId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-96 bg-card rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-4">Application not found</h2>
            <Button asChild>
              <Link to="/">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary shadow-sm">
              <TreePine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{application.name}</h1>
              <p className="text-sm text-muted-foreground">Application ID: {application.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tree View */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border shadow-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TreePine className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Hierarchy Tree</h2>
              </div>
              
              {treeNodes.length > 0 ? (
                <Tree
                  nodes={treeNodes}
                  selectedIds={new Set()}
                  onSelectionChange={() => {}}
                  multiSelect={false}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TreePine className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No nodes created yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="nodes" className="space-y-6">
              <TabsList className="bg-card border shadow-sm">
                <TabsTrigger value="nodes" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nodes Management
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Roles & Permissions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nodes" className="space-y-6">
                <NodesManager 
                  appId={appId!} 
                  onRefresh={refreshNodes}
                  selectedNodeIds={new Set()}
                />
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <RolesPermissionsManager 
                  appId={appId!} 
                  treeNodes={treeNodes}
                  onRefresh={refreshNodes}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}