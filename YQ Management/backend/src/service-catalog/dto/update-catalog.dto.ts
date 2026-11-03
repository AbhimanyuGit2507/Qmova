import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCatalogDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

