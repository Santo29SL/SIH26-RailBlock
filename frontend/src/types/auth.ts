export type UserRole =
  | 'ADMIN'
  | 'SECTION_CONTROLLER'
  | 'STATION_MASTER'
  | 'DEPARTMENT_ENGINEER'
  | 'DIVISIONAL_AUTHORITY';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  department?: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  username: string;
}

export interface DemoUserPreset {
  username: string;
  label: string;
  role: UserRole;
  roleDescription: string;
  department: string;
  badgeColor: string;
}
