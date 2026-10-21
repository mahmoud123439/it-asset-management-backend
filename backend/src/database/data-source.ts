import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Asset, Department, Employee, User, License, Assignment, Maintenance, Procurement, Notification, AuditLog, Attachment, LicenseSeat } from '../entities';
export const entities = [Asset, Department, Employee, User, License, Assignment, Maintenance, Procurement, Notification, AuditLog, Attachment, LicenseSeat];
export default new DataSource({ type: 'postgres', url: process.env.DATABASE_URL, entities, migrations: [__dirname + '/migrations/*{.ts,.js}'], synchronize: false, logging: false });
