import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RagService } from './rag.service';
import { TextQueryDto, VoiceQueryDto } from './dto';

@Controller('query')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('text')
  async textQuery(@Body() textQueryDto: TextQueryDto) {
    return await this.ragService.processTextQuery(textQueryDto);
  }

  @Post('voice')
  async voiceQuery(@Body() voiceQueryDto: VoiceQueryDto) {
    return await this.ragService.processVoiceQuery(voiceQueryDto);
  }

  @Get('logs')
  async getQueryLogs() {
    return await this.ragService.getQueryLogs();
  }

  @Get('logs/:id')
  async getQueryLog(@Param('id') id: string) {
    return await this.ragService.getQueryLog(id);
  }
}
