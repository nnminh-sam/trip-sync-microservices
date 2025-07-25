import { TokenClaimsDto } from 'src/dtos/token-claims.dto';

export class AuthorizeClaimsPayloadDto {
  claims: TokenClaimsDto;
  required: {
    roles: string[];
    permission: {
      action: string;
      resource: string;
    };
  };
}
