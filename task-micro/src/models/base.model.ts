import {
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export class BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  /**
   * Check if the entity is soft deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }

  /**
   * Soft delete the entity
   */
  softDelete(): void {
    this.deletedAt = new Date();
  }

  /**
   * Restore a soft deleted entity
   */
  restore(): void {
    this.deletedAt = null;
  }

  /**
   * Hook to ensure consistency before insert
   */
  @BeforeInsert()
  beforeInsert() {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    if (!this.updatedAt) {
      this.updatedAt = new Date();
    }
  }

  /**
   * Hook to ensure consistency before update
   */
  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}
