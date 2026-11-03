import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsInt()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQty?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;
}

