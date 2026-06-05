import { base44 } from '@/api/base44Client';
export const User = Object.assign({}, base44.entities.User, base44.auth);
export default User;
