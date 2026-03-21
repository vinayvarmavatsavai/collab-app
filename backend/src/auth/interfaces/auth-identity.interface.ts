import { IdentityStatus } from "../entities/identity.entity";

export interface AuthIdentity {
    id: string;
    email: string;
    passwordHash: string;
    type: 'USER' | 'COMPANY' | 'INSTITUTION';
    status: IdentityStatus;
}
