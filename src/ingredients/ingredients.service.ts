import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Ingredient } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { DeleteIngredientResponseDto } from './dto/delete-ingredient-response.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Visible catalog for account A:
   * - all ingredients
   * - minus id_original replaced by A
   * - minus id_new belonging to other accounts
   */
  async findVisibleForAccount(
    idAccount: number,
  ): Promise<IngredientResponseDto[]> {
    const [ingredients, mappings] = await Promise.all([
      this.prisma.ingredient.findMany({
        orderBy: { idIngredient: 'asc' },
      }),
      this.prisma.originalNewIngredient.findMany({
        select: {
          idAccount: true,
          idOriginal: true,
          idNew: true,
        },
      }),
    ]);

    const idsToRemove = new Set<number>();
    const ownedNewIds = new Set<number>();

    for (const mapping of mappings) {
      if (mapping.idAccount === idAccount) {
        ownedNewIds.add(mapping.idNew);
        if (mapping.idOriginal != null) {
          idsToRemove.add(mapping.idOriginal);
        }
      }
      if (mapping.idAccount !== idAccount) {
        idsToRemove.add(mapping.idNew);
      }
    }

    return ingredients
      .filter((row) => !idsToRemove.has(row.idIngredient))
      .map((row) => this.toResponse(row, ownedNewIds.has(row.idIngredient)));
  }

  /**
   * Create a new account-owned ingredient:
   * ingredients row + original_new_ingredients (id_original = null, id_new = new).
   */
  async createForAccount(
    idAccount: number,
    dto: CreateIngredientDto,
  ): Promise<IngredientResponseDto> {
    const created = await this.prisma.$transaction(async (tx) => {
      const neu = await tx.ingredient.create({
        data: {
          nameEs: dto.name_es.trim(),
          nameEn: dto.name_en.trim(),
          emoji: dto.emoji,
          fat100g: dto.fat_100g,
          protein100g: dto.protein_100g,
          carbs100g: dto.carbs_100g,
          kcalPer100g: dto.kcal_per_100g,
          weightPerUnit: dto.weight_per_unit,
        },
      });

      await tx.originalNewIngredient.create({
        data: {
          idAccount,
          idOriginal: null,
          idNew: neu.idIngredient,
        },
      });

      return neu;
    });

    return this.toResponse(created, true);
  }

  /**
   * Edit an existing catalog ingredient for the current account.
   * - If already this account's `id_new` → update that ingredient row.
   * - Else (global / not owned) → create a new ingredient + original_new mapping.
   */
  async updateForAccount(
    idAccount: number,
    idIngredient: number,
    dto: UpdateIngredientDto,
  ): Promise<IngredientResponseDto> {
    const existing = await this.prisma.ingredient.findUnique({
      where: { idIngredient },
    });
    if (!existing) {
      throw new NotFoundException('INGREDIENTS.ERRORS.NOT_FOUND');
    }

    const ownedMapping = await this.prisma.originalNewIngredient.findFirst({
      where: {
        idAccount,
        idNew: idIngredient,
      },
    });

    const patch = {
      nameEs: dto.name_es.trim(),
      nameEn: dto.name_en.trim(),
      emoji: dto.emoji,
      fat100g: dto.fat_100g,
      protein100g: dto.protein_100g,
      carbs100g: dto.carbs_100g,
      kcalPer100g: dto.kcal_per_100g,
      weightPerUnit: dto.weight_per_unit,
    };

    if (ownedMapping) {
      const updated = await this.prisma.ingredient.update({
        where: { idIngredient },
        data: patch,
      });
      return this.toResponse(updated, true);
    }

    const alreadyReplaced = await this.prisma.originalNewIngredient.findFirst({
      where: {
        idAccount,
        idOriginal: idIngredient,
      },
    });
    if (alreadyReplaced) {
      throw new BadRequestException('INGREDIENTS.ERRORS.ALREADY_REPLACED');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const neu = await tx.ingredient.create({
        data: patch,
      });

      await tx.originalNewIngredient.create({
        data: {
          idAccount,
          idOriginal: idIngredient,
          idNew: neu.idIngredient,
        },
      });

      return neu;
    });

    return this.toResponse(created, true);
  }

  /**
   * Delete an account-owned custom ingredient only (must have original_new row).
   * Removes the mapping + ingredients row, and scrubs the id from account recipes.
   */
  async deleteForAccount(
    idAccount: number,
    idIngredient: number,
  ): Promise<DeleteIngredientResponseDto> {
    const ownedMapping = await this.prisma.originalNewIngredient.findFirst({
      where: {
        idAccount,
        idNew: idIngredient,
      },
    });

    if (!ownedMapping) {
      const exists = await this.prisma.ingredient.findUnique({
        where: { idIngredient },
        select: { idIngredient: true },
      });
      if (!exists) {
        throw new NotFoundException('INGREDIENTS.ERRORS.NOT_FOUND');
      }
      throw new ForbiddenException('INGREDIENTS.ERRORS.DELETE_NOT_ALLOWED');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.originalNewIngredient.delete({
        where: { idOriginalNew: ownedMapping.idOriginalNew },
      });

      await tx.ingredient.delete({
        where: { idIngredient },
      });

      const recipes = await tx.recipe.findMany({
        where: { idAccount },
        select: {
          idRecipie: true,
          ingredients: true,
        },
      });

      for (const recipe of recipes) {
        if (!recipe.ingredients.includes(idIngredient)) {
          continue;
        }
        await tx.recipe.update({
          where: { idRecipie: recipe.idRecipie },
          data: {
            ingredients: recipe.ingredients.filter((id) => id !== idIngredient),
          },
        });
      }
    });

    return plainToInstance(
      DeleteIngredientResponseDto,
      { success: true },
      { excludeExtraneousValues: true },
    );
  }

  private toResponse(
    ingredient: Ingredient,
    canDelete: boolean,
  ): IngredientResponseDto {
    return plainToInstance(
      IngredientResponseDto,
      {
        id_ingredient: ingredient.idIngredient,
        name_es: ingredient.nameEs,
        name_en: ingredient.nameEn,
        emoji: ingredient.emoji,
        fat_100g: ingredient.fat100g,
        protein_100g: ingredient.protein100g,
        carbs_100g: ingredient.carbs100g,
        kcal_per_100g: ingredient.kcalPer100g,
        weight_per_unit: ingredient.weightPerUnit,
        can_delete: canDelete,
      },
      { excludeExtraneousValues: true },
    );
  }
}
