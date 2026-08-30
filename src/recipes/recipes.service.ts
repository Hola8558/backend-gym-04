import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Recipe } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { OBJECT_STORAGE } from '../storage/constants/object-storage.token';
import type { ObjectStorageProvider } from '../storage/interfaces/object-storage-provider.interface';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CreateRecipeResponseDto } from './dto/create-recipe-response.dto';
import { DeleteRecipeResponseDto } from './dto/delete-recipe-response.dto';
import { RecipeResponseDto } from './dto/recipe-response.dto';
import type { ItemIngrediente } from './types/item-ingrediente.type';
import {
  buildItemIngredienteArraySql,
  parseItemIngredienteArray,
} from './utils/item-ingrediente-raw-sql.util';

const RECIPE_IMAGE_CONTENT_TYPE = 'image/webp';

@Injectable()
export class RecipesService {
  private readonly r2PublicBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorageProvider,
  ) {
    this.r2PublicBaseUrl = (
      this.configService.get<string>('R2_PUBLIC_BASE_URL') ?? ''
    ).replace(/\/+$/, '');
  }

  async findForAccount(idAccount: number): Promise<RecipeResponseDto[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: {
        OR: [{ idAccount }, { idAccount: null }],
      },
      orderBy: [{ createdAt: 'asc' }, { idRecipie: 'asc' }],
    });

    const cantidadesById = await this.loadCantidadesByRecipeIds(
      recipes.map((row) => row.idRecipie),
    );

    return recipes.map((row) =>
      this.toResponse(row, cantidadesById.get(row.idRecipie) ?? []),
    );
  }

  async createForAccount(
    idAccount: number,
    dto: CreateRecipeDto,
  ): Promise<CreateRecipeResponseDto> {
    const { ingredients, cantidades } = this.resolveIngredientsWrite(dto);

    const created = await this.prisma.recipe.create({
      data: {
        idAccount,
        name: dto.name.trim(),
        fat: dto.fat,
        protein: dto.protein,
        carb: dto.carb,
        ingredients,
      },
    });

    if (cantidades) {
      await this.persistCantidades(created.idRecipie, cantidades);
    }

    const imageKey = this.buildRecipeImageKey(created.idRecipie);
    const uploadUrl = await this.objectStorage.getUploadSignedUrl({
      key: imageKey,
      contentType: RECIPE_IMAGE_CONTENT_TYPE,
    });

    return plainToInstance(
      CreateRecipeResponseDto,
      {
        id_recipie: created.idRecipie,
        upload_url: uploadUrl,
      },
      { excludeExtraneousValues: true },
    );
  }

  async updateForAccount(
    idAccount: number,
    idRecipie: number,
    dto: CreateRecipeDto,
  ): Promise<CreateRecipeResponseDto> {
    const existing = await this.prisma.recipe.findFirst({
      where: {
        idRecipie,
        idAccount,
      },
    });

    if (!existing) {
      throw new NotFoundException('RECIPES.ERRORS.NOT_FOUND');
    }

    const { ingredients, cantidades } = this.resolveIngredientsWrite(dto);

    const updated = await this.prisma.recipe.update({
      where: { idRecipie: existing.idRecipie },
      data: {
        name: dto.name.trim(),
        fat: dto.fat,
        protein: dto.protein,
        carb: dto.carb,
        ingredients,
      },
    });

    if (cantidades) {
      await this.persistCantidades(updated.idRecipie, cantidades);
    }

    const imageKey = this.buildRecipeImageKey(updated.idRecipie);
    const uploadUrl = await this.objectStorage.getUploadSignedUrl({
      key: imageKey,
      contentType: RECIPE_IMAGE_CONTENT_TYPE,
    });

    return plainToInstance(
      CreateRecipeResponseDto,
      {
        id_recipie: updated.idRecipie,
        upload_url: uploadUrl,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Compensating delete for failed R2 upload after create.
   * Only tenant-owned rows (id_account match); never global recipes.
   */
  async deleteForAccount(
    idAccount: number,
    idRecipie: number,
  ): Promise<DeleteRecipeResponseDto> {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        idRecipie,
        idAccount,
      },
    });

    if (!recipe) {
      throw new NotFoundException('RECIPES.ERRORS.NOT_FOUND');
    }

    await this.prisma.recipe.delete({
      where: { idRecipie: recipe.idRecipie },
    });

    return plainToInstance(
      DeleteRecipeResponseDto,
      { success: true },
      { excludeExtraneousValues: true },
    );
  }

  private resolveIngredientsWrite(dto: CreateRecipeDto): {
    ingredients: number[];
    cantidades: ItemIngrediente[] | null;
  } {
    // `ingredients` is the authoritative id list; cantidades only supply grams.
    const ingredients = (dto.ingredients ?? [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!dto.ingredientes_cantidades?.length) {
      return { ingredients, cantidades: null };
    }

    const gramosById = new Map<number, number>();
    for (const row of dto.ingredientes_cantidades) {
      const id = Number(row.ingrediente_id);
      if (!Number.isFinite(id) || id <= 0) {
        continue;
      }
      gramosById.set(id, Number(row.gramos) || 0);
    }

    const idList =
      ingredients.length > 0 ? ingredients : [...gramosById.keys()];

    const cantidades: ItemIngrediente[] = idList.map((ingrediente_id) => ({
      ingrediente_id,
      gramos: gramosById.get(ingrediente_id) ?? 0,
    }));

    return { ingredients: idList, cantidades };
  }

  private async persistCantidades(
    idRecipie: number,
    items: readonly ItemIngrediente[],
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE recipes
      SET ingredientes_cantidades = ${buildItemIngredienteArraySql(items)}
      WHERE id_recipie = ${idRecipie}
    `;
  }

  private async loadCantidadesByRecipeIds(
    ids: readonly number[],
  ): Promise<Map<number, ItemIngrediente[]>> {
    const map = new Map<number, ItemIngrediente[]>();
    if (ids.length === 0) {
      return map;
    }

    // Cast Unsupported composite array to text — Prisma cannot deserialize
    // gym_db._item_ingrediente from $queryRaw without a supported scalar type.
    const rows = await this.prisma.$queryRaw<
      { id_recipie: number; ingredientes_cantidades: string | null }[]
    >`
      SELECT
        id_recipie,
        ingredientes_cantidades::text AS ingredientes_cantidades
      FROM recipes
      WHERE id_recipie IN (${Prisma.join(ids)})
    `;

    for (const row of rows) {
      map.set(
        Number(row.id_recipie),
        parseItemIngredienteArray(row.ingredientes_cantidades),
      );
    }

    return map;
  }

  private buildRecipeImageKey(idRecipie: number): string {
    return `recipes/recipe_${idRecipie}.webp`;
  }

  private buildPublicImageUrl(idRecipie: number): string {
    return `${this.r2PublicBaseUrl}/${this.buildRecipeImageKey(idRecipie)}`;
  }

  private toResponse(
    recipe: Recipe,
    cantidades: ItemIngrediente[],
  ): RecipeResponseDto {
    return plainToInstance(
      RecipeResponseDto,
      {
        id_recipie: recipe.idRecipie,
        id_account: recipe.idAccount,
        name: recipe.name,
        fat: recipe.fat,
        protein: recipe.protein,
        carb: recipe.carb,
        ingredients: recipe.ingredients ?? [],
        ingredientes_cantidades: cantidades,
        url_image: this.buildPublicImageUrl(recipe.idRecipie),
      },
      { excludeExtraneousValues: true },
    );
  }
}
