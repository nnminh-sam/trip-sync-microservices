import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as openpgp from 'openpgp';

export interface VerificationResult {
  isValid: boolean;
  signer?: string;
  error?: string;
}

@Injectable()
export class GnuPgVerificationService {
  private readonly logger = new Logger(GnuPgVerificationService.name);

  /**
   * Verify a detached GPG signature against file data using a public key
   * @param fileData - The original file data (as Buffer or string)
   * @param signatureArmored - The detached signature in armored format (text)
   * @param publicKeyArmored - The public key in armored format (text)
   * @returns VerificationResult with isValid flag and signer info
   */
  async verifyDetachedSignature(
    fileData: Buffer | string,
    signatureArmored: string,
    publicKeyArmored: string,
  ): Promise<VerificationResult> {
    try {
      // Validate inputs
      if (!fileData) {
        throw new BadRequestException('File data is required');
      }
      if (!signatureArmored || signatureArmored.trim() === '') {
        throw new BadRequestException('Signature is required');
      }
      if (!publicKeyArmored || publicKeyArmored.trim() === '') {
        throw new BadRequestException('Public key is required');
      }

      // Convert file data to buffer if string
      const messageData =
        typeof fileData === 'string'
          ? Buffer.from(fileData, 'utf-8')
          : fileData;

      // Parse the signature
      const signature = await openpgp.readSignature({
        armoredSignature: signatureArmored,
      });

      // Parse the public key
      const publicKey = await openpgp.readKey({
        armoredKey: publicKeyArmored,
      });

      // Create message object from binary data
      const message = await openpgp.createMessage({
        binary: messageData,
      });

      // Verify the signature
      const verificationResult = await openpgp.verify({
        message,
        signature,
        verificationKeys: publicKey,
      });

      // Check signature validity
      const verified = await verificationResult.signatures[0].verified;

      if (!verified) {
        this.logger.warn('Signature verification failed');
        return {
          isValid: false,
          error: 'Signature verification failed',
        };
      }

      // Get signer information
      const signerKeyID = verificationResult.signatures[0].keyID.toHex();
      const signer = signerKeyID;

      this.logger.debug(`Signature verified successfully by key: ${signer}`);

      return {
        isValid: true,
        signer,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Signature verification error: ${errorMessage}`);

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify a signature with string-based message data
   * @param messageText - The text message to verify
   * @param signatureArmored - The detached signature
   * @param publicKeyArmored - The public key
   */
  async verifyTextSignature(
    messageText: string,
    signatureArmored: string,
    publicKeyArmored: string,
  ): Promise<VerificationResult> {
    return this.verifyDetachedSignature(messageText, signatureArmored, publicKeyArmored);
  }
}
