import { PlatformAdmin, Hod, Lecturer } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: (PlatformAdmin | Hod | Lecturer) & { role: string; universityId?: string };
    }
  }
}

export {};