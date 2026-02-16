import type { User, Organization, Employee } from "./database";

export interface AuthUser {
  id: string;
  email: string;
}

export interface UserProfile extends User {
  organization?: Organization | null;
  employee?: Employee | null;
}

export interface SessionData {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
