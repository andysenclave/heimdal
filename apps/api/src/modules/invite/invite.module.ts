import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { InviteValidationController } from './invite-validation.controller';
import { InviteService } from './invite.service';

@Module({
  controllers: [InviteController, InviteValidationController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
