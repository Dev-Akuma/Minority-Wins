import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import admin from 'firebase-admin';
import { PrismaService } from '../../prisma.service';
import { VaultService } from '../vault/vault.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
  ) {}

  onModuleInit() {
    if (!admin.apps.length) {
      // Possible paths for the service account JSON
      // 1. Render Secret File path (/etc/secrets/...)
      // 2. Local dev path (backend/src/config/...)
      const renderSecretPath = '/etc/secrets/firebase-service-account.json';
      const localPath = path.resolve(__dirname, '../../../config/firebase-service-account.json');
      
      let credential;
      if (fs.existsSync(renderSecretPath)) {
        console.log('Using Firebase Service Account from Render Secrets.');
        credential = admin.credential.cert(require(renderSecretPath));
      } else if (fs.existsSync(localPath)) {
        console.log('Using Firebase Service Account from local config.');
        credential = admin.credential.cert(require(localPath));
      } else {
        console.warn('Firebase Service Account JSON not found! Looked in:', renderSecretPath, 'and', localPath);
      }

      admin.initializeApp({
        credential, // if undefined, firebase-admin uses GOOGLE_APPLICATION_CREDENTIALS automatically
      });
    }
  }

  async verifyFirebaseToken(idToken: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw new UnauthorizedException('Phone number not present in token');
      }

      // Restrict to +91 as requested
      if (!phoneNumber.startsWith('+91')) {
        throw new UnauthorizedException('Only Indian phone numbers (+91) are allowed.');
      }

      return this.handleUserLogin(phoneNumber, decodedToken.uid);
    } catch (error: any) {
      throw new UnauthorizedException(error.message || 'Invalid Firebase Token');
    }
  }

  private async handleUserLogin(phoneNumber: string, firebaseUid: string) {
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      // Create new user with 1000 INR initial grant
      const newId = `usr_${Date.now()}`;
      user = await this.prisma.user.create({
        data: {
          id: newId,
          phoneNumber,
          username: `Player_${phoneNumber.slice(-4)}_${Math.floor(Math.random() * 1000)}`,
          balance: 1000,
        },
      });

      await this.prisma.vaultTransaction.create({
        data: {
          userId: user.id,
          amount: 1000,
          type: 'INITIAL_GRANT',
          referenceId: 'WELCOME_BONUS',
        },
      });
    }

    const payload = { sub: user.id, phoneNumber: user.phoneNumber };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        balance: user.balance,
      },
    };
  }
}
