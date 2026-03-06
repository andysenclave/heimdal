import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

/**
 * CMS Module — i18n content management system.
 * Deferred to Month 2. Module structure preserved for architectural completeness.
 */
@Module({
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
