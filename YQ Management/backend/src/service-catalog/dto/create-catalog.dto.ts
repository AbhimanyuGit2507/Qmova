import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCatalogDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

