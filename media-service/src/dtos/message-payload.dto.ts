export class TokenClaimsDto {
  sub: string; // User ID
  email: string;
  roles?: string[];
  jti: string; // Token ID
  exp: number; // Expiry timestamp
}

export class MessagePayloadDto<T = null> {
  claims?: TokenClaimsDto;

  request?: {
    body?: T;
    path?: Record<string, any>;
    param?: Record<string, any>;
  };
}
