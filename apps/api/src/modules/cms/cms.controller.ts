import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CmsService } from './cms.service';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('status')
  @ApiOperation({ summary: 'CMS module status (deferred to Month 2)' })
  getStatus() {
    return this.cmsService.getStatus();
  }
}
