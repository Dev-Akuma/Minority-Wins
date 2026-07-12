"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const prisma_service_1 = require("../../prisma.service");
const vault_service_1 = require("../vault/vault.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let AuthService = class AuthService {
    jwtService;
    prisma;
    vaultService;
    constructor(jwtService, prisma, vaultService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.vaultService = vaultService;
    }
    onModuleInit() {
        if ((0, app_1.getApps)().length === 0) {
            const renderSecretPath = '/etc/secrets/firebase-service-account.json';
            const localPath = path.resolve(__dirname, '../../../config/firebase-service-account.json');
            let credential;
            if (fs.existsSync(renderSecretPath)) {
                console.log('Using Firebase Service Account from Render Secrets.');
                credential = (0, app_1.cert)(require(renderSecretPath));
            }
            else if (fs.existsSync(localPath)) {
                console.log('Using Firebase Service Account from local config.');
                credential = (0, app_1.cert)(require(localPath));
            }
            else {
                console.warn('Firebase Service Account JSON not found! Looked in:', renderSecretPath, 'and', localPath);
            }
            (0, app_1.initializeApp)({
                credential,
            });
        }
    }
    async verifyFirebaseToken(idToken) {
        try {
            const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(idToken);
            const phoneNumber = decodedToken.phone_number;
            if (!phoneNumber) {
                throw new common_1.UnauthorizedException('Phone number not present in token');
            }
            if (!phoneNumber.startsWith('+91')) {
                throw new common_1.UnauthorizedException('Only Indian phone numbers (+91) are allowed.');
            }
            return this.handleUserLogin(phoneNumber, decodedToken.uid);
        }
        catch (error) {
            throw new common_1.UnauthorizedException(error.message || 'Invalid Firebase Token');
        }
    }
    async handleUserLogin(phoneNumber, firebaseUid) {
        let user = await this.prisma.user.findUnique({
            where: { phoneNumber },
        });
        if (!user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        vault_service_1.VaultService])
], AuthService);
//# sourceMappingURL=auth.service.js.map