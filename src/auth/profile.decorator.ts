import { SetMetadata } from '@nestjs/common';

export const PROFILE_KEY = 'profile';

export const Profile = (userType?: 'customer' | 'partner') =>
  SetMetadata(PROFILE_KEY, userType);