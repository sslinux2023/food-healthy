import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ShoppingListService } from './shopping-list.service.js';
import { UpdateShoppingItemDto } from './update-shopping-item.dto.js';
import { CreateShoppingItemDto } from './create-shopping-item.dto.js';

@Controller('shopping-list')
@UseGuards(JwtAuthGuard)
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Get()
  getList(@Req() req: { user: { id: string } }) {
    return this.shoppingListService.getList(Number(req.user.id));
  }

  @Post('item')
  addManualItem(
    @Req() req: { user: { id: string } },
    @Body() body: CreateShoppingItemDto,
  ) {
    return this.shoppingListService.addManualItem(Number(req.user.id), body);
  }

  @Patch(':id')
  setChecked(
    @Req() req: { user: { id: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateShoppingItemDto,
  ) {
    return this.shoppingListService.setChecked(Number(req.user.id), id, body.isChecked);
  }

  @Delete()
  clearChecked(@Req() req: { user: { id: string } }) {
    return this.shoppingListService.clearChecked(Number(req.user.id));
  }
}
