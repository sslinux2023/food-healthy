import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShoppingListController } from './shopping-list.controller.js';
import { ShoppingListService } from './shopping-list.service.js';

@Module({
  controllers: [ShoppingListController],
  providers: [ShoppingListService, PrismaService],
})
export class ShoppingListModule {}
