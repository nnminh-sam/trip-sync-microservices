import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as openpgp from 'openpgp';

export interface VerificationResult {
  isValid: boolean;
  signer?: string;
  error?: string;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  signerKeyId?: string;
  error?: string;
}

@Injectable()
export class GnuPgVerificationService {
  private readonly logger = new Logger(GnuPgVerificationService.name);
  private readonly apiGatewayUrl: string;
  private readonly publicKeyEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.apiGatewayUrl =
      this.configService.get('API_GATEWAY_BASE_URL') ||
      'http://localhost:80';

    this.publicKeyEndpoint = `${this.apiGatewayUrl}/api/v1/users/my/public-key`;
  }

  /**
   * Verify a detached signature against file data
   */
  async verifyDetachedSignature(
    fileData: Buffer | string,
    signatureArmored: string,
    publicKeyArmored: string,
  ): Promise<VerificationResult> {
    try {
      if (!fileData) throw new BadRequestException('File data is required');
      if (!signatureArmored.trim())
        throw new BadRequestException('Signature is required');
      if (!publicKeyArmored.trim())
        throw new BadRequestException('Public key is required');

      const message = await openpgp.createMessage({
        binary:
          typeof fileData === 'string'
            ? Buffer.from(fileData, 'utf8')
            : fileData,
      });

      const signature = await openpgp.readSignature({
        armoredSignature: signatureArmored,
      });

      const publicKey = await openpgp.readKey({
        armoredKey: publicKeyArmored,
      });

      const verification = await openpgp.verify({
        message,
        signature,
        verificationKeys: publicKey,
      });

      const firstSig = verification.signatures[0];
      const valid = await firstSig.verified;

      if (!valid) {
        return {
          isValid: false,
          error: 'Signature verification failed',
        };
      }

      const signerKeyId = firstSig.keyID.toHex();
      return { isValid: true, signer: signerKeyId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Detached signature verification error: ${msg}`);

      return { isValid: false, error: msg };
    }
  }

  /**
   * Shortcut for verifying text signatures
   */
  async verifyTextSignature(
    messageText: string,
    signatureArmored: string,
    publicKeyArmored: string,
  ) {
    return this.verifyDetachedSignature(
      messageText,
      signatureArmored,
      publicKeyArmored,
    );
  }

  /**
   * Verify detached signature for media upload
   */
  async verifySignature(
    fileBuffer: Buffer,
    armoredSignature: string,
    jwtToken: string,
  ): Promise<SignatureVerificationResult> {
    try {
      if (!fileBuffer?.length)
        return { isValid: false, error: 'File buffer is empty' };
      if (!armoredSignature.trim())
        return { isValid: false, error: 'Signature is missing' };
      if (!jwtToken.trim())
        return { isValid: false, error: 'JWT token is required' };

      const publicKey = await this.fetchUserPublicKey(jwtToken);
      if (!publicKey)
        return {
          isValid: false,
          error:
            'No public key found. User must upload a GPG public key before uploading signed media.',
        };

      const signature = await openpgp.readSignature({
        armoredSignature: armoredSignature,
      });

      const signingIds = signature.getSigningKeyIDs();
      if (!signingIds.length)
        return { isValid: false, error: 'No signing key ID found in signature' };

      const signerKeyId = signingIds[0].toHex();

      const message = await openpgp.createMessage({
        binary: fileBuffer,
      });

      const verificationResult = await openpgp.verify({
        message,
        signature,
        verificationKeys: await openpgp.readKey({
          armoredKey: publicKey,
        }),
      });

      const isValid = await verificationResult.signatures[0].verified;

      if (!isValid) {
        return {
          isValid: false,
          signerKeyId,
          error: 'Signature verification failed — invalid signature',
        };
      }

      return { isValid: true, signerKeyId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Signature verification failed: ${msg}`);
      return { isValid: false, error: msg };
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