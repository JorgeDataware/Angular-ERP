import { UserRole } from './permission';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  groupId: number;
  role: UserRole;
  active: boolean;
}
