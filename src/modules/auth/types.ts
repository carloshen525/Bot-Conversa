export type UserRole = "admin" | "operador" | "atendimento" | "gestor";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  avatar?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RolePermissions {
  canManageChatbots: boolean;
  canPublishChatbots: boolean;
  canManageChannels: boolean;
  canViewContacts: boolean;
  canEditContacts: boolean;
  canManageUsers: boolean;
  canViewLogs: boolean;
  canManageSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageChatbots: true,
    canPublishChatbots: true,
    canManageChannels: true,
    canViewContacts: true,
    canEditContacts: true,
    canManageUsers: true,
    canViewLogs: true,
    canManageSettings: true,
  },
  gestor: {
    canManageChatbots: true,
    canPublishChatbots: true,
    canManageChannels: false,
    canViewContacts: true,
    canEditContacts: true,
    canManageUsers: false,
    canViewLogs: true,
    canManageSettings: false,
  },
  operador: {
    canManageChatbots: true,
    canPublishChatbots: false,
    canManageChannels: false,
    canViewContacts: true,
    canEditContacts: true,
    canManageUsers: false,
    canViewLogs: false,
    canManageSettings: false,
  },
  atendimento: {
    canManageChatbots: false,
    canPublishChatbots: false,
    canManageChannels: false,
    canViewContacts: true,
    canEditContacts: true,
    canManageUsers: false,
    canViewLogs: false,
    canManageSettings: false,
  },
};

export interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  role: UserRole;
  isAdmin: boolean;
  permissions: RolePermissions;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, "nome" | "avatar">>) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}
