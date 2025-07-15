import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_REQUEST_KEY = 'isPublicRequest';
export const PublicRequest = () => SetMetadata(IS_PUBLIC_REQUEST_KEY, true);
