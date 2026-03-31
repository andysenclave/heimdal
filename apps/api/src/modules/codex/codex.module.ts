import { Module } from '@nestjs/common';
import { CodexController } from './codex.controller';
import { CodexPublicController } from './codex-public.controller';
import { CodexVersionService } from './codex-version.service';
import { CodexScreenService } from './codex-screen.service';
import { CodexContentService } from './codex-content.service';
import { CodexLocaleService } from './codex-locale.service';
import { CodexStorageService } from './services/codex-storage.service';
import { CodexAiService } from './services/codex-ai.service';
import { CodexTranslationService } from './codex-translation.service';

@Module({
  controllers: [CodexController, CodexPublicController],
  providers: [
    CodexVersionService,
    CodexScreenService,
    CodexContentService,
    CodexLocaleService,
    CodexStorageService,
    CodexAiService,
    CodexTranslationService,
  ],
  exports: [
    CodexVersionService,
    CodexScreenService,
    CodexContentService,
    CodexLocaleService,
    CodexStorageService,
    CodexAiService,
    CodexTranslationService,
  ],
})
export class CodexModule {}
