import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../entities';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto);
    return await this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return await this.documentRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDocumentDto);
    document.updatedAt = new Date();
    return await this.documentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    await this.documentRepository.remove(document);
  }

  async search(query: string): Promise<Document[]> {
    return await this.documentRepository
      .createQueryBuilder('document')
      .where('document.title ILIKE :query OR document.content ILIKE :query', {
        query: `%${query}%`
      })
      .orderBy('document.createdAt', 'DESC')
      .getMany();
  }
}