import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { resolveUnitSystem } from '../../accounts/utils/resolve-unit-system.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ClientMetricHistoryResponseDto } from './dto/client-metric-history-response.dto';
import { ClientMetricsResponseDto } from './dto/client-metrics-response.dto';
import { MetricCatalogResponseDto } from './dto/metric-catalog-response.dto';
import { CreateClientMetricDto } from './dto/create-client-metric.dto';
import { WEIGHT_METRIC_KEY, type MetricFieldDefinition } from './types/metric-field.type';
import { measurementUnitSymbol } from './utils/measurement-unit-symbol.util';
import { normalizeClientMetricInput } from './utils/normalize-client-metric-input.util';
import { formatMetricDateOnly, parseMetricDate } from './utils/parse-metric-date.util';
import { readGlobalMeasurements } from './utils/read-global-measurements.util';
import { toClientMetricHistoryResponse } from './utils/to-client-metric-history-response.util';
import { toClientMetricsResponse } from './utils/to-client-metrics-response.util';
import { toMetricCatalogResponse } from './utils/to-metric-catalog-response.util';

@Injectable()
export class CustomersMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(idAccount: number): Promise<MetricCatalogResponseDto> {
    const catalog = await this.loadCatalog(idAccount);
    return toMetricCatalogResponse({
      unit_system: catalog.unitSystem,
      fields: fieldsFor(catalog),
    });
  }

  async getLatest(
    idAccount: number,
    idUser: number,
  ): Promise<ClientMetricsResponseDto> {
    await this.assertCustomer(idAccount, idUser);
    return this.buildResponse(idAccount, idUser);
  }

  async listHistory(
    idAccount: number,
    idUser: number,
  ): Promise<ClientMetricHistoryResponseDto> {
    await this.assertCustomer(idAccount, idUser);
    const rows = await this.prisma.clientMetric.findMany({
      where: { idAccount, idUser, deletedAt: null },
      orderBy: { date: 'desc' },
      select: metricSelect,
    });
    return toClientMetricHistoryResponse(rows.map((row) => toMetricEntry(row)));
  }

  async create(
    idAccount: number,
    idUser: number,
    dto: CreateClientMetricDto,
  ): Promise<ClientMetricsResponseDto> {
    await this.assertCustomer(idAccount, idUser);
    const date = parseMetricDate(dto.date);
    if (!date) {
      throw new BadRequestException('CUSTOMERS.METRICS.ERRORS.INVALID_DATE');
    }

    const catalog = await this.loadCatalog(idAccount);
    const normalized = normalizeClientMetricInput(
      dto.weight,
      dto.measurements,
      catalog.measurements,
    );
    if (normalized === 'INVALID_VALUE') {
      throw new BadRequestException('CUSTOMERS.METRICS.ERRORS.INVALID_VALUE');
    }
    if (normalized === 'EMPTY') {
      throw new BadRequestException('CUSTOMERS.METRICS.ERRORS.EMPTY');
    }

    await this.prisma.clientMetric.create({
      data: {
        idAccount,
        idUser,
        date,
        weight: normalized.weight,
        measurements: normalized.measurements as Prisma.InputJsonValue,
      },
    });

    return this.buildResponse(idAccount, idUser);
  }

  async update(
    idAccount: number,
    idUser: number,
    idMeasure: string,
    dto: CreateClientMetricDto,
  ): Promise<ClientMetricsResponseDto> {
    await this.assertCustomer(idAccount, idUser);
    const date = parseMetricDate(dto.date);
    if (!date) {
      throw new BadRequestException('CUSTOMERS.METRICS.ERRORS.INVALID_DATE');
    }
    const existing = await this.findActiveMetric(idAccount, idUser, idMeasure);
    const catalog = await this.loadCatalog(idAccount);
    const normalized = normalizeClientMetricInput(
      dto.weight,
      dto.measurements,
      catalog.measurements,
    );
    if (normalized === 'INVALID_VALUE') {
      throw new BadRequestException('CUSTOMERS.METRICS.ERRORS.INVALID_VALUE');
    }
    if (normalized === 'EMPTY') {
      throw new BadRequestException('CUSTOMERS.METRICS.ERRORS.EMPTY');
    }

    const changed = !sameMetricContent(existing, {
      date,
      weight: normalized.weight,
      measurements: normalized.measurements,
    });
    await this.prisma.clientMetric.update({
      where: { idMeasure },
      data: {
        date,
        weight: normalized.weight,
        measurements: normalized.measurements as Prisma.InputJsonValue,
        ...(changed ? { editedAt: new Date() } : {}),
      },
    });
    return this.buildResponse(idAccount, idUser);
  }

  async softDelete(
    idAccount: number,
    idUser: number,
    idMeasure: string,
  ): Promise<ClientMetricsResponseDto> {
    await this.assertCustomer(idAccount, idUser);
    const result = await this.prisma.clientMetric.updateMany({
      where: { idMeasure, idAccount, idUser, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('CUSTOMERS.METRICS.ERRORS.NOT_FOUND');
    }
    return this.buildResponse(idAccount, idUser);
  }

  private async buildResponse(
    idAccount: number,
    idUser: number,
  ): Promise<ClientMetricsResponseDto> {
    const catalog = await this.loadCatalog(idAccount);
    const latest = await this.prisma.clientMetric.findFirst({
      where: { idAccount, idUser, deletedAt: null },
      orderBy: { date: 'desc' },
      select: metricSelect,
    });

    return toClientMetricsResponse({
      unit_system: catalog.unitSystem,
      fields: fieldsFor(catalog),
      latest: latest ? toMetricEntry(latest) : null,
    });
  }

  private async loadCatalog(idAccount: number): Promise<{
    unitSystem: ReturnType<typeof resolveUnitSystem>;
    measurements: ReturnType<typeof readGlobalMeasurements>;
  }> {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { globalMeasurements: true, unitSystem: true },
    });
    return {
      unitSystem: resolveUnitSystem(detail?.unitSystem),
      measurements: readGlobalMeasurements(detail?.globalMeasurements),
    };
  }

  private async findActiveMetric(idAccount: number, idUser: number, idMeasure: string) {
    const row = await this.prisma.clientMetric.findFirst({
      where: { idMeasure, idAccount, idUser, deletedAt: null },
      select: metricSelect,
    });
    if (!row) {
      throw new NotFoundException('CUSTOMERS.METRICS.ERRORS.NOT_FOUND');
    }
    return row;
  }

  private async assertCustomer(idAccount: number, idUser: number): Promise<void> {
    const customer = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        role: UserRole.customer,
        status: { not: GenericStatus.deleted },
      },
      select: { idUser: true },
    });
    if (!customer) {
      throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
    }
  }
}

function fieldsFor(catalog: {
  unitSystem: ReturnType<typeof resolveUnitSystem>;
  measurements: ReturnType<typeof readGlobalMeasurements>;
}): MetricFieldDefinition[] {
  return [
    {
      key: WEIGHT_METRIC_KEY,
      label: '',
      unit_type: 'weight',
      unit: measurementUnitSymbol('weight'),
    },
    ...catalog.measurements.map((field) => ({
      key: field.key,
      label: field.label,
      unit_type: field.unit_type,
      unit: measurementUnitSymbol(field.unit_type),
    })),
  ];
}

const metricSelect = {
  idMeasure: true,
  date: true,
  weight: true,
  measurements: true,
  editedAt: true,
} satisfies Prisma.ClientMetricSelect;

function toMetricEntry(row: {
  idMeasure: string;
  date: Date;
  weight: Prisma.Decimal | null;
  measurements: Prisma.JsonValue;
  editedAt: Date | null;
}): {
  id_measure: string;
  date: string;
  weight: number | null;
  measurements: Record<string, number>;
  edited_at: string | null;
} {
  return {
    id_measure: row.idMeasure,
    date: formatMetricDateOnly(row.date),
    weight: toMetricNumber(row.weight),
    measurements: readStoredMeasurements(row.measurements),
    edited_at: row.editedAt ? row.editedAt.toISOString() : null,
  };
}

function sameMetricContent(
  existing: {
    date: Date;
    weight: Prisma.Decimal | null;
    measurements: Prisma.JsonValue;
  },
  next: {
    date: Date;
    weight: number | null;
    measurements: Record<string, number>;
  },
): boolean {
  if (formatMetricDateOnly(existing.date) !== formatMetricDateOnly(next.date)) {
    return false;
  }
  if (toMetricNumber(existing.weight) !== next.weight) {
    return false;
  }
  const current = readStoredMeasurements(existing.measurements);
  const keys = new Set([...Object.keys(current), ...Object.keys(next.measurements)]);
  for (const key of keys) {
    if ((current[key] ?? null) !== (next.measurements[key] ?? null)) {
      return false;
    }
  }
  return true;
}

function toMetricNumber(value: Prisma.Decimal | null): number | null {
  if (value == null) {
    return null;
  }
  return value.toNumber();
}

function readStoredMeasurements(value: Prisma.JsonValue): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const stored: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      stored[key] = raw;
    }
  }
  return stored;
}
