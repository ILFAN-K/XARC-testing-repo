import { IsNumber, Min } from 'class-validator';

export class PurchaseLicensesDto {
  @IsNumber()
  @Min(1)
  additionalLicenses!: number;
}
