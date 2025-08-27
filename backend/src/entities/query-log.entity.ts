import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';

export enum QueryType {
  TEXT = 'text',
  VOICE = 'voice',
}

export enum QueryStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL = 'partial',
}

@Entity('query_logs')
@Index(['queryType'])
@Index(['status'])
@Index(['createdAt'])
export class QueryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  query: string;

  @Column({
    type: 'enum',
    enum: QueryType,
    default: QueryType.TEXT,
  })
  queryType: QueryType;

  @Column({ type: 'text', nullable: true })
  response?: string;

  @Column({
    type: 'enum',
    enum: QueryStatus,
    default: QueryStatus.SUCCESS,
  })
  status: QueryStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'integer', default: 0 })
  responseTime: number; // in milliseconds

  @Column({ type: 'float', nullable: true })
  confidence?: number; // confidence score from vector search

  @Column({ type: 'integer', default: 0 })
  documentsRetrieved: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sessionId?: string;

  // Reference to the most relevant document used
  @ManyToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'primary_document_id' })
  primaryDocument?: Document;

  @Column({ type: 'uuid', nullable: true })
  primaryDocumentId?: string;

  @Column({ type: 'json', nullable: true })
  retrievedDocumentIds?: string[]; // Array of document IDs used in response

  @CreateDateColumn()
  createdAt: Date;
}
