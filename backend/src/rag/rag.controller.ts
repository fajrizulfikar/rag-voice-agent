import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { RagService } from './rag.service';
import { TextQueryDto, VoiceQueryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, GetUser } from '../auth/decorators';
import { UserRole, User } from '../entities';

@Controller('query')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('text')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async textQuery(
    @Body() textQueryDto: TextQueryDto,
    @GetUser() _user: User,
  ) {
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
}
