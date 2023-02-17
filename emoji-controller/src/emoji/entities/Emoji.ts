import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity()
export class Emoji {
  @PrimaryGeneratedColumn()
  emoji_id: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ unique: true, nullable: false })
  emoji_name: string

  @Column({ nullable: true })
  emoji_key: string

  @Column({ nullable: false })
  cover: string

  @Column({ nullable: false })
  inside: string
}
