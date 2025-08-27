import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DocumentsModule } from '../documents';
import { RagModule } from '../rag';

@Module({
  imports: [DocumentsModule, RagModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
