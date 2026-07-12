import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { VaultService } from '../vault/vault.service';
export declare class AuthService implements OnModuleInit {
    private readonly jwtService;
    private readonly prisma;
    private readonly vaultService;
    constructor(jwtService: JwtService, prisma: PrismaService, vaultService: VaultService);
    onModuleInit(): void;
    verifyFirebaseToken(idToken: string): Promise<{
        access_token: string;
        user: {
            id: string;
            phoneNumber: string;
            username: string;
            balance: number;
        };
    }>;
    private handleUserLogin;
}
