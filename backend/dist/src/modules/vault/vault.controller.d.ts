import { VaultService } from './vault.service';
export declare class VaultController {
    private readonly vaultService;
    constructor(vaultService: VaultService);
    getBalance(userId: string): Promise<import("../../engines/match/types").User>;
}
