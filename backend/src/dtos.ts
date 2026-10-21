import { IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from './entities';
export class AssetDto {
 @IsString() @MaxLength(40) assetTag!:string; @IsString() @MaxLength(160) name!:string; @IsEnum(['LAPTOP','DESKTOP','PRINTER','NETWORK_DEVICE','PHONE','OTHER']) category!:string;
 @IsOptional() @IsString() serialNumber?:string; @IsOptional() @IsString() model?:string; @IsOptional() @IsString() vendor?:string; @IsOptional() @IsEnum(['IN_STOCK','ASSIGNED','IN_REPAIR','RETIRED']) status?:string;
 @IsOptional() @IsDateString() purchaseDate?:string; @IsOptional() @Transform(({value})=>Number(value)) @IsNumber() @Min(0) purchaseCost?:number; @IsOptional() @IsDateString() warrantyExpiry?:string; @IsOptional() @IsString() location?:string; @IsOptional() @IsString() @MaxLength(4000) notes?:string;
}
export class UpdateAssetDto {
 @IsOptional() @IsString() @MaxLength(40) assetTag?:string; @IsOptional() @IsString() @MaxLength(160) name?:string; @IsOptional() @IsEnum(['LAPTOP','DESKTOP','PRINTER','NETWORK_DEVICE','PHONE','OTHER']) category?:string;
 @IsOptional() @IsString() serialNumber?:string; @IsOptional() @IsString() model?:string; @IsOptional() @IsString() vendor?:string; @IsOptional() @IsEnum(['IN_STOCK','ASSIGNED','IN_REPAIR','RETIRED']) status?:string;
 @IsOptional() @IsDateString() purchaseDate?:string; @IsOptional() @Transform(({value})=>Number(value)) @IsNumber() @Min(0) purchaseCost?:number; @IsOptional() @IsDateString() warrantyExpiry?:string; @IsOptional() @IsString() location?:string; @IsOptional() @IsString() @MaxLength(4000) notes?:string;
}
export class CreateLicenseDto { @IsString() name!:string; @IsString() vendor!:string; @IsString() @MinLength(1) licenseKey!:string; @Transform(({value})=>Number(value)) @IsInt() @Min(1) seatsTotal!:number; @IsOptional() @Transform(({value})=>Number(value)) @IsNumber() @Min(0) cost?:number; @IsOptional() @IsDateString() purchaseDate?:string; @IsOptional() @IsDateString() renewalDate?:string; }
export class LoginDto { @IsEmail() email!:string; @IsString() @MinLength(8) password!:string; }
export class AssignDto { @IsUUID() assetId!:string; @IsUUID() employeeId!:string; }
export class CreateEmployeeDto { @IsString() firstName!:string; @IsString() lastName!:string; @IsEmail() email!:string; @IsOptional() @IsString() title?:string; @IsOptional() @IsUUID() departmentId?:string; }
export class UpdateEmployeeDto { @IsOptional() @IsString() firstName?:string; @IsOptional() @IsString() lastName?:string; @IsOptional() @IsEmail() email?:string; @IsOptional() @IsString() title?:string; @IsOptional() @IsUUID() departmentId?:string; @IsOptional() active?:boolean; }
export class CreateUserDto { @IsEmail() email!:string; @IsString() @MinLength(12) password!:string; @IsEnum(['ADMIN','IT_MANAGER','TECHNICIAN','VIEWER']) role!:Role; }
export class UpdateUserDto { @IsOptional() @IsEnum(['ADMIN','IT_MANAGER','TECHNICIAN','VIEWER']) role?:Role; @IsOptional() active?:boolean; }
export class CreateDepartmentDto { @IsString() @MaxLength(120) name!:string; @IsOptional() @IsString() costCenter?:string; }
export class UpdateDepartmentDto { @IsOptional() @IsString() @MaxLength(120) name?:string; @IsOptional() @IsString() costCenter?:string; }
export class CreateProcurementDto { @IsString() title!:string; @IsString() description!:string; @Transform(({value})=>Number(value)) @IsInt() @Min(1) quantity!:number; @IsOptional() @Transform(({value})=>Number(value)) @IsNumber() @Min(0) estimatedCost?:number; }
export class ProcurementStatusDto { @IsEnum(['APPROVED','REJECTED','ORDERED','RECEIVED']) status!:string; @IsOptional() @IsString() decisionNotes?:string; }
export class MaintenanceDto { @IsUUID() assetId!:string; @IsString() type!:string; @IsString() description!:string; @IsOptional() @Transform(({value})=>Number(value)) @IsNumber() @Min(0) cost?:number; @IsDateString() date!:string; }
export class UpdateLicenseDto { @IsOptional() @IsString() name?:string; @IsOptional() @IsString() vendor?:string; @IsOptional() @IsString() @MinLength(1) licenseKey?:string; @IsOptional() @Transform(({value})=>Number(value)) @IsInt() @Min(1) seatsTotal?:number; @IsOptional() @Transform(({value})=>Number(value)) @IsNumber() @Min(0) cost?:number; @IsOptional() @IsDateString() purchaseDate?:string; @IsOptional() @IsDateString() renewalDate?:string; }
