import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

export type LinkPrecedence = "primary" | "secondary";

@Entity()
export class Contact {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true, type: "int" })
    linkedId?: number | null;

    @Column({
        type: "enum",
        enum: ["primary", "secondary"],
        default: "primary"
    })
    linkPrecedence!: LinkPrecedence;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
} 