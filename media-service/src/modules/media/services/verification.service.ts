import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as nacl from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';

export type VerificationResult = {
  success: boolean;
  signature: string;
};

export interface VerifySignaturePayload {
  message: string;
  signatureBase64: string;
  jwtToken: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly apiGatewayUrl: string;
  private readonly publicKeyEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.apiGatewayUrl =
      this.configService.get('API_GATEWAY_BASE_URL') || 'http://localhost:80';

    this.publicKeyEndpoint = `${this.apiGatewayUrl}/api/v1/users/my/public-key`;
    this.logger.log(`Public Key retrieval endpoint: ${this.publicKeyEndpoint}`);
  }

  async verifySignature(
    payload: VerifySignaturePayload,
  ): Promise<VerificationResult> {
    const { message, signatureBase64, jwtToken } = payload;

    try {
      const parsedMessage = JSON.parse(message);

      const publicKey = await this.fetchUserPublicKey(jwtToken);
      const messageUint8 = Buffer.from(parsedMessage, 'utf8');

      const signatureUint8 = decodeBase64(signatureBase64);
      const publicKeyUint8 = decodeBase64(publicKey);

      const result = nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKeyUint8,
      );
      return {
        success: result,
        signature: signatureBase64,
      };
    } catch (error) {
      this.logger.error(error);
      console.trace(error);
      return {
        success: false,
        signature: signatureBase64,
      };
    }
  }

  /**
   * Fetch user public key from API Gateway
   */
  private async fetchUserPublicKey(jwtToken: string): Promise<string | null> {
    try {
      const res = await axios.get(this.publicKeyEndpoint, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      });

      return res.data?.data?.publicKey || null;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if ([401, 403].includes(err.response?.status || 0)) {
          throw new UnauthorizedException('Invalid or expired JWT token');
        }
      }

      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed fetching public key: ${msg}`);

      throw new BadRequestException('Failed to fetch public key from gateway');
    }
  }
}
