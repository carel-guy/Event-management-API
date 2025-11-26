import { Module } from '@nestjs/common';
import { TarifRule, TarifRuleSchema } from './entities/tariff-rule.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { TarifRuleController } from './tariff-rule.controller';
import { TarifRuleService } from './tariff-rule.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TarifRule.name, schema: TarifRuleSchema },
    ]),
  ],
  controllers: [TarifRuleController],
  providers: [TarifRuleService],
  exports: [TarifRuleService],
})
export class TariffRuleModule {}
