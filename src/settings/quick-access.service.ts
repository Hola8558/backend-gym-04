import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateQuickAccessDto } from './dto/update-quick-access.dto';
import { QuickAccessResponseDto } from './dto/quick-access-response.dto';
import { QuickAccessShortcutsResponseDto } from './dto/quick-access-shortcuts-response.dto';
import {
  QUICK_ACCESS_PER_VIEW_MAX,
  QUICK_ACCESS_SHORTCUT_MAX,
  QuickAccessDocument,
  QuickAccessEntry,
  assertQuickAccessView,
  normalizeQuickAccessFilters,
  normalizeQuickAccessName,
  readQuickAccessDocument,
} from './utils/quick-access.util';

@Injectable()
export class QuickAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async list(idAccount: number, view: string): Promise<QuickAccessResponseDto> {
    const key = assertQuickAccessView(view);
    const document = await this.load(idAccount);
    return this.toResponse(key, document);
  }

  async listShortcuts(idAccount: number): Promise<QuickAccessShortcutsResponseDto> {
    const document = await this.load(idAccount);
    const shortcuts = document.qaccess.flatMap((link) => {
      const entry = (document.filters[link.view] ?? []).find((item) => item.id === link.id);
      if (!entry) {
        return [];
      }
      return [{ id: entry.id, view: link.view, name: entry.name, filters: entry.filters }];
    });
    return Object.assign(new QuickAccessShortcutsResponseDto(), { shortcuts });
  }

  async update(
    idAccount: number,
    dto: UpdateQuickAccessDto,
  ): Promise<QuickAccessResponseDto> {
    const view = assertQuickAccessView(dto.view);
    const document = await this.load(idAccount);
    switch (dto.action) {
      case 'add':
        this.addEntry(document, view, dto);
        break;
      case 'rename':
        this.renameEntry(document, view, dto.id ?? '', dto.name ?? '');
        break;
      case 'remove':
        this.removeEntry(document, view, dto.id ?? '');
        break;
      case 'pin':
        this.pinEntry(document, view, dto.id ?? '');
        break;
      case 'unpin':
        this.unpinEntry(document, view, dto.id ?? '');
        break;
      case 'move':
        this.moveEntry(document, view, dto.id ?? '', dto.direction);
        break;
    }
    await this.save(idAccount, document);
    return this.toResponse(view, document);
  }

  private addEntry(
    document: QuickAccessDocument,
    view: string,
    dto: UpdateQuickAccessDto,
  ): void {
    const current = document.filters[view] ?? [];
    if (current.length >= QUICK_ACCESS_PER_VIEW_MAX) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_LIMIT');
    }
    const name = normalizeQuickAccessName(dto.name ?? '');
    this.assertNameFree(current, name);
    const filters = normalizeQuickAccessFilters(dto.filters ?? {});
    document.filters[view] = [
      ...current,
      { id: `qa_${randomBytes(4).toString('hex')}`, name, filters },
    ];
  }

  private renameEntry(
    document: QuickAccessDocument,
    view: string,
    id: string,
    rawName: string,
  ): void {
    const current = document.filters[view] ?? [];
    const entry = this.requireEntry(current, id);
    const name = normalizeQuickAccessName(rawName);
    this.assertNameFree(current, name, entry.id);
    entry.name = name;
  }

  private removeEntry(document: QuickAccessDocument, view: string, id: string): void {
    const current = document.filters[view] ?? [];
    this.requireEntry(current, id);
    if (document.qaccess.some((item) => item.view === view && item.id === id)) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_SHORTCUT_LOCKED');
    }
    const next = current.filter((entry) => entry.id !== id);
    if (next.length === 0) {
      delete document.filters[view];
    } else {
      document.filters[view] = next;
    }
  }

  private pinEntry(document: QuickAccessDocument, view: string, id: string): void {
    const current = document.filters[view] ?? [];
    this.requireEntry(current, id);
    if (document.qaccess.some((item) => item.view === view && item.id === id)) {
      return;
    }
    if (document.qaccess.length >= QUICK_ACCESS_SHORTCUT_MAX) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_SHORTCUT_LIMIT');
    }
    document.qaccess.push({ id, view });
  }

  private unpinEntry(document: QuickAccessDocument, view: string, id: string): void {
    const current = document.filters[view] ?? [];
    this.requireEntry(current, id);
    document.qaccess = document.qaccess.filter(
      (item) => !(item.view === view && item.id === id),
    );
  }

  private moveEntry(
    document: QuickAccessDocument,
    view: string,
    id: string,
    direction?: 'up' | 'down',
  ): void {
    if (direction !== 'up' && direction !== 'down') {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_MOVE_INVALID');
    }
    const index = document.qaccess.findIndex((item) => item.view === view && item.id === id);
    if (index < 0) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_NOT_FOUND');
    }
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= document.qaccess.length) {
      return;
    }
    const next = document.qaccess.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    document.qaccess = next;
  }

  private requireEntry(current: QuickAccessEntry[], id: string): QuickAccessEntry {
    const entry = current.find((item) => item.id === id);
    if (!entry) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_NOT_FOUND');
    }
    return entry;
  }

  private assertNameFree(current: QuickAccessEntry[], name: string, exceptId?: string): void {
    const taken = current.some(
      (entry) =>
        entry.id !== exceptId &&
        entry.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (taken) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_NAME_TAKEN');
    }
  }

  private async load(idAccount: number): Promise<QuickAccessDocument> {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { filtersAndQaccess: true },
    });
    if (!detail) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }
    const { document, changed } = readQuickAccessDocument(detail.filtersAndQaccess);
    if (changed) {
      await this.save(idAccount, document);
    }
    return document;
  }

  private async save(idAccount: number, document: QuickAccessDocument): Promise<void> {
    await this.prisma.accountDetail.update({
      where: { idAccount },
      data: { filtersAndQaccess: document as unknown as Prisma.InputJsonValue },
    });
  }

  private toResponse(view: string, document: QuickAccessDocument): QuickAccessResponseDto {
    const shortcutIds = document.qaccess
      .filter((item) => item.view === view)
      .map((item) => item.id);
    return Object.assign(new QuickAccessResponseDto(), {
      view,
      entries: document.filters[view] ?? [],
      shortcutIds,
      shortcutCount: document.qaccess.length,
    });
  }
}
