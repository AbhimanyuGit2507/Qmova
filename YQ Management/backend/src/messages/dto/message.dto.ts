import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class SendMessageDto {
  @ValidateIf((o) => !o.media || (o.text !== undefined && o.text !== ''))
  @IsNotEmpty({ message: 'Text or attachment is required' })
  @IsString()
  @MaxLength(2000)
  text?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  media?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
