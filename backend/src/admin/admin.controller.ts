import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { UploadDocumentDto, ReindexDto } from './dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('upload-doc')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return await this.adminService.uploadDocument(file, uploadDocumentDto);
  }

  @Post('upload-text-doc')
  async uploadTextDocument(@Body() uploadDocumentDto: UploadDocumentDto) {
    return await this.adminService.uploadTextDocument(uploadDocumentDto);
  }

  @Get('documents')
  async getAllDocuments() {
    return await this.adminService.getAllDocuments();
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string) {
    return await this.adminService.getDocument(id);
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string) {
    return await this.adminService.deleteDocument(id);
  }

  @Get('query-logs')
  async getQueryLogs() {
    return await this.adminService.getQueryLogs();
  }

  @Get('query-logs/:id')
  async getQueryLog(@Param('id') id: string) {
    return await this.adminService.getQueryLog(id);
  }

  @Post('reindex')
  async reindexVectorDatabase(@Body() reindexDto: ReindexDto) {
    return await this.adminService.reindexVectorDatabase(reindexDto);
  }

  @Get('health')
  async getSystemHealth() {
    return await this.adminService.getSystemHealth();
  }

  @Get('stats')
  async getSystemStats() {
    return await this.adminService.getSystemStats();
  }
}
