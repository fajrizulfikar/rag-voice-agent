import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, GetUser } from '../auth/decorators';
import { UserRole, User } from '../entities';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser() user: User,
  ) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  findAll(@GetUser() user: User) {
    return this.documentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.documentsService.findOne(id);
  }

  @Post(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @GetUser() user: User,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.documentsService.remove(id);
  }
}
