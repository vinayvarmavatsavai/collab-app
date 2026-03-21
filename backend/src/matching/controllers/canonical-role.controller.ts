import { Controller, Get, Query } from '@nestjs/common';
import { CanonicalRoleService, RoleSuggestion } from '../services/canonical-role.service';

@Controller('roles')
export class CanonicalRoleController {
    constructor(private readonly roleService: CanonicalRoleService) { }

    @Get('autocomplete')
    async getAutocomplete(@Query('q') query: string = ''): Promise<RoleSuggestion[]> {
        if (!query || query.trim().length === 0) {
            return await this.roleService.getPopularRoles(10);
        }
        return await this.roleService.getSmartSuggestions(query);
    }
}
