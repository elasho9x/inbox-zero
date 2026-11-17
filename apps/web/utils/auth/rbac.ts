import { z } from 'zod';

// Role definitions (system roles)
export const RoleSchema = z.enum(['ADMIN', 'TEAM_MEMBER']);
export type Role = z.infer<typeof RoleSchema>;

// Team roles (organization/team level)
export const TeamRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
export type TeamRole = z.infer<typeof TeamRoleSchema>;

// Permission definitions
export const PermissionSchema = z.enum([
  // User management
  'users.read',
  'users.write',
  'users.delete',
  'users.invite',
  
  // Email account management
  'accounts.read',
  'accounts.write',
  'accounts.delete',
  'accounts.sync',
  'accounts.manage_all',
  
  // Email operations
  'emails.read',
  'emails.write',
  'emails.send',
  'emails.delete',
  'emails.archive',
  'emails.manage_all',
  
  // AI features
  'ai.read',
  'ai.write',
  'ai.draft',
  'ai.summarize',
  'ai.categorize',
  
  // Settings
  'settings.read',
  'settings.write',
  'settings.billing',
  'settings.integrations',
  
  // Admin
  'admin.users',
  'admin.settings',
  'admin.audit_logs',
  'admin.roles',
  
  // Nylas
  'nylas.connect',
  'nylas.manage',
]);

export type Permission = z.infer<typeof PermissionSchema>;

// System-level role permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'users.read',
    'users.write',
    'users.delete',
    'users.invite',
    'accounts.read',
    'accounts.write',
    'accounts.delete',
    'accounts.sync',
    'accounts.manage_all',
    'emails.read',
    'emails.write',
    'emails.send',
    'emails.delete',
    'emails.archive',
    'emails.manage_all',
    'ai.read',
    'ai.write',
    'ai.draft',
    'ai.summarize',
    'ai.categorize',
    'settings.read',
    'settings.write',
    'settings.billing',
    'settings.integrations',
    'admin.users',
    'admin.settings',
    'admin.audit_logs',
    'admin.roles',
    'nylas.connect',
    'nylas.manage',
  ],
  TEAM_MEMBER: [
    'accounts.read',
    'accounts.sync',
    'emails.read',
    'emails.write',
    'emails.send',
    'emails.archive',
    'ai.read',
    'ai.draft',
    'ai.summarize',
    'settings.read',
  ],
};

// Team role permissions
export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  OWNER: [
    'users.read',
    'users.write',
    'users.delete',
    'users.invite',
    'accounts.read',
    'accounts.write',
    'accounts.delete',
    'accounts.sync',
    'accounts.manage_all',
    'emails.read',
    'emails.write',
    'emails.send',
    'emails.delete',
    'emails.archive',
    'emails.manage_all',
    'ai.read',
    'ai.write',
    'ai.draft',
    'ai.summarize',
    'ai.categorize',
    'settings.read',
    'settings.write',
    'settings.billing',
    'settings.integrations',
    'admin.users',
    'admin.settings',
    'admin.audit_logs',
    'admin.roles',
    'nylas.connect',
    'nylas.manage',
    'team.manage',
    'team.delete',
  ],
  ADMIN: [
    'users.read',
    'users.write',
    'users.invite',
    'accounts.read',
    'accounts.write',
    'accounts.sync',
    'emails.read',
    'emails.write',
    'emails.send',
    'emails.archive',
    'ai.read',
    'ai.write',
    'ai.draft',
    'ai.summarize',
    'ai.categorize',
    'settings.read',
    'settings.write',
    'team.manage',
  ],
  MEMBER: [
    'accounts.read',
    'accounts.sync',
    'emails.read',
    'emails.write',
    'emails.send',
    'emails.archive',
    'ai.read',
    'ai.draft',
    'ai.summarize',
    'settings.read',
  ],
};

// Check if system role has permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if team role has permission
export function hasTeamPermission(teamRole: TeamRole, permission: Permission): boolean {
  return TEAM_ROLE_PERMISSIONS[teamRole]?.includes(permission) ?? false;
}

// Check if role has any of the permissions
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

// Check if role has all permissions
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

// Get all permissions for a role
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Get all permissions for a team role
export function getTeamPermissionsForRole(teamRole: TeamRole): Permission[] {
  return TEAM_ROLE_PERMISSIONS[teamRole] ?? [];
}

// Check if team role has permission
export function hasTeamAnyPermission(teamRole: TeamRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasTeamPermission(teamRole, p));
}

// Check if team role has all permissions
export function hasTeamAllPermissions(teamRole: TeamRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasTeamPermission(teamRole, p));
}

// Permission checks for specific resources (system-level)
export function canAccessAccount(role: Role, accountOwnerId: string, currentUserId: string): boolean {
  if (role === 'ADMIN') return true;
  return accountOwnerId === currentUserId;
}

export function canManageAccount(role: Role, accountOwnerId: string, currentUserId: string): boolean {
  if (role === 'ADMIN') return true;
  return accountOwnerId === currentUserId;
}

export function canSendEmail(role: Role, accountOwnerId: string, currentUserId: string): boolean {
  if (role === 'ADMIN') return true;
  return accountOwnerId === currentUserId;
}

export function canAccessEmails(role: Role, accountOwnerId: string, currentUserId: string): boolean {
  if (role === 'ADMIN') return true;
  return accountOwnerId === currentUserId;
}

export function canManageUser(role: Role, targetUserId: string, currentUserId: string): boolean {
  if (role === 'ADMIN') return true;
  return targetUserId === currentUserId;
}

export function canInviteUser(role: Role): boolean {
  return role === 'ADMIN';
}

export function canDeleteUser(role: Role): boolean {
  return role === 'ADMIN';
}

export function canManageRoles(role: Role): boolean {
  return role === 'ADMIN';
}

export function canAccessAuditLogs(role: Role): boolean {
  return role === 'ADMIN';
}

export function canManageBilling(role: Role): boolean {
  return role === 'ADMIN';
}

export function canManageIntegrations(role: Role): boolean {
  return role === 'ADMIN';
}

export function canConnectNylas(role: Role): boolean {
  return role === 'ADMIN';
}

export function canManageNylas(role: Role): boolean {
  return role === 'ADMIN';
}

// Team-level permission checks
export function canManageTeam(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'team.manage');
}

export function canDeleteTeam(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'team.delete');
}

export function canInviteTeamMember(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'users.invite') || hasTeamPermission(teamRole, 'users.write');
}

export function canManageTeamRoles(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'team.manage');
}

export function canManageTeamBilling(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'settings.billing');
}

export function canManageTeamIntegrations(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'settings.integrations');
}

export function canManageTeamNylas(teamRole: TeamRole): boolean {
  return hasTeamPermission(teamRole, 'nylas.connect') || hasTeamPermission(teamRole, 'nylas.manage');
}