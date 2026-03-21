export interface AccessTokenPayload {
    sub: string;
    type: 'USER' | 'COMPANY' | 'INSTITUTION';
    roles: string[];
}

export interface RefreshTokenPayload {
    sub: string;
    sessionId: string;
}
