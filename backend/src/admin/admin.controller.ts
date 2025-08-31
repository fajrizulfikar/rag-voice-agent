import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { UploadDocumentDto, ReindexDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, GetUser } from '../auth/decorators';
import { UserRole, User } from '../entities';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('upload-doc')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @GetUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return await this.adminService.uploadDocument(file, uploadDocumentDto);
  }

  @Post('upload-text-doc')
  async uploadTextDocument(
    @Body() uploadDocumentDto: UploadDocumentDto,
    @GetUser() user: User,
  ) {
    return await this.adminService.uploadTextDocument(uploadDocumentDto);
  }

  @Get('documents')
  async getAllDocuments(@GetUser() user: User) {
    return await this.adminService.getAllDocuments();
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string, @GetUser() user: User) {
    return await this.adminService.getDocument(id);
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string, @GetUser() user: User) {
    return await this.adminService.deleteDocument(id);
  }

  @Get('query-logs')
  async getQueryLogs(@GetUser() user: User) {
    return await this.adminService.getQueryLogs();
  }

  @Get('query-logs/:id')
  async getQueryLog(@Param('id') id: string, @GetUser() user: User) {
    return await this.adminService.getQueryLog(id);
  }

  @Post('reindex')
  async reindexVectorDatabase(
    @Body() reindexDto: ReindexDto,
    @GetUser() user: User,
  ) {
    return await this.adminService.reindexVectorDatabase(reindexDto);
  }

  @Get('health')
  async getSystemHealth(@GetUser() user: User) {
    return await this.adminService.getSystemHealth();
  }

  @Get('stats')
  async getSystemStats(@GetUser() user: User) {
    return await this.adminService.getSystemStats();
  }
}
