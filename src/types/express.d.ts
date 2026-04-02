import type { JwtPayload } from '../auth/jwt.strategy';

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export {};
