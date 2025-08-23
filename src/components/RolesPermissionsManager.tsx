import { useState, useEffect } from 'react';
import { Shield, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Tree, TreeNode } from '@/components/ui/tree';
import { Role, roleAPI, permissionAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface RolesPermissionsManagerProps {
  appId: string;
  treeNodes: TreeNode[];
  onRefresh: () => void;
}

export function RolesPermissionsManager({ appId, treeNodes, onRefresh }: RolesPermissionsManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissionNodeIds, setPermissionNodeIds] = useState<Set<string>>(new Set());
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleNames, setNewRoleNames] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRoles = async () => {
    try {
      const appRoles = await roleAPI.getByApp(appId);
      setRoles(appRoles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load roles.",
        variant: "destructive",
      });
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      const role = await roleAPI.getById(appId, roleId);
      const nodeIds = role.permissions?.map(p => p.nodeId) || [];
      const permissionSet = new Set(nodeIds);
      setPermissionNodeIds(permissionSet);
      setEditingPermissions(permissionSet);
      setIsEditingPermissions(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load role permissions.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadRoles();
  }, [appId]);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  const handleAddRoles = async () => {
    const names = newRoleNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (names.length === 0) return;

    setIsLoading(true);
    try {
      await roleAPI.add(appId, names);
      toast({
        title: "Roles added",
        description: `Successfully added ${names.length} role(s).`,
      });
      setIsAddRoleDialogOpen(false);
      setNewRoleNames('');
      loadRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add roles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || !editRoleName.trim()) return;

    setIsLoading(true);
    try {
      await roleAPI.edit(appId, editingRole.id, editRoleName.trim());
      toast({
        title: "Role updated",
        description: `Successfully updated "${editingRole.name}" to "${editRoleName.trim()}".`,
      });
      setIsEditRoleDialogOpen(false);
      setEditingRole(null);
      setEditRoleName('');
      loadRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    setIsLoading(true);
    try {
      await roleAPI.delete(appId, role.id);
      toast({
        title: "Role deleted",
        description: `Successfully deleted "${role.name}".`,
      });
      if (selectedRole === role.id) {
        setSelectedRole('');
      }
      loadRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPermissions = () => {
    setEditingPermissions(new Set(permissionNodeIds));
    setIsEditingPermissions(true);
  };

  const handleCancelEdit = () => {
    setEditingPermissions(new Set(permissionNodeIds));
    setIsEditingPermissions(false);
  };

  const handleConfirmPermissions = async () => {
    if (!selectedRole) return;

    const oldIds = permissionNodeIds;
    const newIds = editingPermissions;
    const addedIds = Array.from(newIds).filter(id => !oldIds.has(id));
    const removedIds = Array.from(oldIds).filter(id => !newIds.has(id));

    setIsLoading(true);
    try {
      // Remove old permissions first
      if (removedIds.length > 0) {
        await permissionAPI.remove(appId, {
          roleId: selectedRole,
          nodeIds: removedIds
        });
      }

      // Add new permissions
      if (addedIds.length > 0) {
        await permissionAPI.add(appId, {
          roleId: selectedRole,
          nodeIds: addedIds
        });
      }

      setPermissionNodeIds(new Set(editingPermissions));
      setIsEditingPermissions(false);
      
      toast({
        title: "Permissions updated",
        description: "Successfully updated role permissions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setIsEditRoleDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Role Management */}
      <Card className="bg-gradient-subtle border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Role Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Roles
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Roles</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roleNames">Role Names (one per line)</Label>
                    <Textarea
                      id="roleNames"
                      value={newRoleNames}
                      onChange={(e) => setNewRoleNames(e.target.value)}
                      placeholder="Admin&#10;Editor&#10;Viewer"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRoles} disabled={isLoading || !newRoleNames.trim()}>
                    {isLoading ? "Adding..." : "Add Roles"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roles List */}
          {roles.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Roles</Label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium">{role.name}</span>
                      <div className="text-sm text-muted-foreground">ID: {role.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(role)}
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
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{role.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRole(role)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Permission Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="roleSelect">Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="roleSelect">
                <SelectValue placeholder="Choose a role to manage permissions" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Node Permissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Current permissions for {roles.find(r => r.id === selectedRole)?.name}
                  </p>
                </div>
                {!isEditingPermissions && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEditPermissions}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Permissions
                  </Button>
                )}
              </div>
              
              {treeNodes.length > 0 ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Tree
                    nodes={treeNodes}
                    selectedIds={isEditingPermissions ? editingPermissions : permissionNodeIds}
                    onSelectionChange={isEditingPermissions ? setEditingPermissions : () => {}}
                    multiSelect={true}
                    smartSelection={true}
                  />
                  
                  {isEditingPermissions && (
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleConfirmPermissions}
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Confirm Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No nodes available for permission assignment.</p>
                </div>
              )}
            </div>
          )}

          {!selectedRole && roles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Create roles first to manage permissions.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRoleName">Role Name</Label>
              <Input
                id="editRoleName"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={isLoading || !editRoleName.trim()}>
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}