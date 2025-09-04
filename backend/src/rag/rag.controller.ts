import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Query,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RagService } from './rag.service';
import { TextQueryDto, VoiceQueryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, GetUser } from '../auth/decorators';
import { UserRole, User } from '../entities';

// DTOs for the new endpoints
interface DocumentUploadDto {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  source?: string;
}

interface DocumentBatchUploadDto {
  documents: DocumentUploadDto[];
}

interface SearchQueryDto {
  query: string;
  limit?: number;
  scoreThreshold?: number;
  filter?: any;
}

@Controller('query')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('text')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async textQuery(@Body() textQueryDto: TextQueryDto, @GetUser() _user: User) {
    return await this.ragService.processTextQuery(textQueryDto);
  }

  @Post('voice')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async voiceQuery(
    @Body() voiceQueryDto: VoiceQueryDto,
    @GetUser() _user: User,
  ) {
    return await this.ragService.processVoiceQuery(voiceQueryDto);
  }

  @Get('logs')
  @Roles(UserRole.ADMIN)
  async getQueryLogs(@GetUser() _user: User) {
    return await this.ragService.getQueryLogs();
  }

  @Get('logs/:id')
  @Roles(UserRole.ADMIN)
  async getQueryLog(@Param('id') id: string, @GetUser() _user: User) {
    return await this.ragService.getQueryLog(id);
  }

  // Document management endpoints
  @Post('documents')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @Body() document: DocumentUploadDto,
    @GetUser() _user: User,
  ) {
    await this.ragService.uploadDocument(document);
    return {
      message: 'Document uploaded successfully',
      documentId: document.id,
    };
  }

  @Post('documents/batch')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async uploadDocumentsBatch(
    @Body() batchData: DocumentBatchUploadDto,
    @GetUser() _user: User,
  ) {
    await this.ragService.uploadDocumentsBatch(batchData.documents);
    return {
      message: 'Documents uploaded successfully',
      count: batchData.documents.length,
    };
  }

  @Put('documents/:id')
  @Roles(UserRole.ADMIN)
  async updateDocument(
    @Param('id') id: string,
    @Body() document: Omit<DocumentUploadDto, 'id'>,
    @GetUser() _user: User,
  ) {
    await this.ragService.updateDocument({ ...document, id });
    return { message: 'Document updated successfully', documentId: id };
  }

  @Delete('documents/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string, @GetUser() _user: User) {
    await this.ragService.deleteDocument(id);
  }

  // Advanced search endpoints
  @Post('search')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async searchDocuments(
    @Body() searchQuery: SearchQueryDto,
    @GetUser() _user: User,
  ) {
    return await this.ragService.searchDocuments(searchQuery.query, {
      limit: searchQuery.limit,
      scoreThreshold: searchQuery.scoreThreshold,
      filter: searchQuery.filter,
    });
  }

  // Vector database management endpoints
  @Get('database/info')
  @Roles(UserRole.ADMIN)
  async getDatabaseInfo(@GetUser() _user: User) {
    return await this.ragService.getVectorDatabaseInfo();
  }

  @Post('database/snapshot')
  @Roles(UserRole.ADMIN)
  async createSnapshot(@GetUser() _user: User) {
    const snapshotName = await this.ragService.createDatabaseSnapshot();
    return { message: 'Snapshot created successfully', snapshotName };
  }

  @Post('database/optimize')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async optimizeDatabase(@GetUser() _user: User) {
    await this.ragService.optimizeVectorDatabase();
  }

  @Post('database/reindex')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reindexDatabase(@GetUser() _user: User) {
    await this.ragService.reindexVectorDatabase();
  }
}
