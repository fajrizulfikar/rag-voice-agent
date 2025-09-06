import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('documents')
@Index(['isActive'])
@Index(['category'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON string for additional metadata

  @Column({ type: 'varchar', length: 255, nullable: true })
  source?: string; // Original file name or source

  @Column({ type: 'varchar', length: 64, nullable: true })
  vectorId?: string; // Qdrant vector ID for this document

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  tags: string;

  // Helper method to parse metadata
  getParsedMetadata(): Record<string, any> {
    try {
      return this.metadata ? JSON.parse(this.metadata) : {};
    } catch {
      return {};
    }
  }

  // Helper method to set metadata
  setMetadata(metadata: Record<string, any>): void {
    this.metadata = JSON.stringify(metadata);
  }
}
