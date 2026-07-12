import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginWithPhone(idToken: string): Promise<{
        access_token: string;
        user: {
            id: string;
            phoneNumber: string;
            username: string;
            balance: number;
        };
    }>;
}
