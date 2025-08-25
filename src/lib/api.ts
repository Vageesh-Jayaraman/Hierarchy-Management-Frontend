const BASE_URL = 'https://hierarchy-management-system.onrender.com';

export interface Application {
  id: string;
  name: string;
}

export interface Node {
  nodeId: string;
  appId: number;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  permissions?: Array<{ name: string; nodeId: string }>;
}

export interface Permission {
  roleId: string;
  nodeIds: string[];
}

export interface NodeConnection {
  nodeId: string;
  parentId: string;
}

export interface TreeNode {
  name: string;
  nodeId: string;
  parentId: string | null;
}

// Application APIs
export const applicationAPI = {
  getAll: async (): Promise<Application[]> => {
    const response = await fetch(`${BASE_URL}/application/all`);
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
  },

  getById: async (appId: string): Promise<Application> => {
    const response = await fetch(`${BASE_URL}/application/${appId}`);
    if (!response.ok) throw new Error('Failed to fetch application');
    return response.json();
  },

  create: async (name: string): Promise<Application> => {
    const response = await fetch(`${BASE_URL}/application/add?name=${encodeURIComponent(name)}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to create application');
    return response.json();
  },
};

// Node APIs
export const nodeAPI = {
  getByApp: async (appId: string): Promise<Node[]> => {
    const response = await fetch(`${BASE_URL}/node/get/${appId}/only`);
    if (!response.ok) throw new Error('Failed to fetch nodes');
    return response.json();
  },

  getTree: async (appId: string): Promise<TreeNode[]> => {
    const response = await fetch(`${BASE_URL}/node/get/${appId}/`);
    if (!response.ok) throw new Error('Failed to fetch tree');
    return response.json();
  },

  add: async (appId: string, names: string[]): Promise<void> => {
    const response = await fetch(`${BASE_URL}/node/add/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(names),
    });
    if (!response.ok) throw new Error('Failed to add nodes');
  },

  connect: async (appId: string, connections: NodeConnection[]): Promise<void> => {
    const response = await fetch(`${BASE_URL}/node/connect/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connections),
    });
    if (!response.ok) throw new Error('Failed to connect nodes');
  },

  edit: async (appId: string, nodeId: string, name: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/node/edit/${appId}/${nodeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(name),
    });
    if (!response.ok) throw new Error('Failed to edit node');
  },

  delete: async (appId: string, nodeId: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/node/delete/${appId}/${nodeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete node');
  },
};

// Role APIs
export const roleAPI = {
  getByApp: async (appId: string): Promise<Role[]> => {
    const response = await fetch(`${BASE_URL}/role/get/${appId}/only`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    const data = await response.json();
    return data.map((r: any) => ({
      id: r.nodeId,        
      name: r.roleName,    
    }));
  },

  getById: async (appId: string, roleId: string): Promise<Role> => {
    const response = await fetch(`${BASE_URL}/role/get/${appId}/${roleId}`);
    if (!response.ok) throw new Error('Failed to fetch role');
    const data = await response.json();

    if (Array.isArray(data)) {
      return {
        id: roleId,
        name: '',
        permissions: data,
      };
    }

    return {
      id: roleId,
      name: data?.roleName || data?.name || '',
      permissions: Array.isArray(data?.permissions) ? data.permissions : [],
    };
  },

  add: async (appId: string, names: string[]): Promise<void> => {
    const response = await fetch(`${BASE_URL}/role/add/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(names),
    });
    if (!response.ok) throw new Error('Failed to add roles');
  },

  edit: async (appId: string, roleId: string, name: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/role/edit/${appId}/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(name),
    });
    if (!response.ok) throw new Error('Failed to edit role');
  },

  delete: async (appId: string, roleId: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/role/delete/${appId}/${roleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete role');
  },
};

// Permission APIs
export const permissionAPI = {
  add: async (appId: string, permission: Permission): Promise<void> => {
    const response = await fetch(`${BASE_URL}/permission/add/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permission),
    });
    if (!response.ok) throw new Error('Failed to add permission');
  },

  remove: async (appId: string, permission: Permission): Promise<void> => {
    const response = await fetch(`${BASE_URL}/permission/delete/${appId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permission),
    });
    if (!response.ok) throw new Error('Failed to remove permission');
  },
};