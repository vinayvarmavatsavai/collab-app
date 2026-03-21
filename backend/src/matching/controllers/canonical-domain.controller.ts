import { Controller, Get, Query } from '@nestjs/common';
import { CanonicalDomainService, DomainSuggestion } from '../services/canonical-domain.service';

@Controller('domains')
export class CanonicalDomainController {
    constructor(private readonly domainService: CanonicalDomainService) { }

    @Get('autocomplete')
    async getAutocomplete(@Query('q') query: string = ''): Promise<DomainSuggestion[]> {
        if (!query || query.trim().length === 0) {
            return await this.domainService.getPopularDomains(10);
        }
        return await this.domainService.getSmartSuggestions(query);
    }
}
