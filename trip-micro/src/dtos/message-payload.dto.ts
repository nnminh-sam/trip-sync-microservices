import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

export class MessagePayloadDto<T = null> {
  claims?: TokenClaimsDto;
  request?: {
    body?: T;
    path?: Record<string, any>;
    param?: Record<string, any>;
  };
}
