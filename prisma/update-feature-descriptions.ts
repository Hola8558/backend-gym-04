import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const coachSessionsDescription = {
  title: 'Cuentas de Acceso para Entrenadores',
  description:
    'Permite crear credenciales individuales (usuario y contraseña) para cada entrenador. Esto garantiza mayor seguridad, trazabilidad de acciones y un control de acceso estructurado dentro del sistema del gimnasio.',
};

const entryLogsDescription = {
  title: 'Registro y Control de Accesos',
  description:
    'Permite registrar las entradas de los clientes mediante su número de usuario, facilitando el monitoreo de asistencia, horarios de llegada y análisis de afluencia en las instalaciones.',
};

async function main() {
  const coachSessions = await prisma.feature.updateMany({
    where: {
      name: {
        in: ['NO_COACH_SESSIONS_CREATION', 'COACH_SESSIONS_CREATION'],
      },
    },
    data: {
      name: 'COACH_SESSIONS_CREATION',
      description: coachSessionsDescription,
    },
  });

  const entryLogs = await prisma.feature.updateMany({
    where: {
      name: {
        in: ['NO_ENTRY_LOGS', 'ENTRY_LOGS'],
      },
    },
    data: {
      name: 'ENTRY_LOGS',
      description: entryLogsDescription,
    },
  });

  console.log(
    `Updated features: COACH_SESSIONS_CREATION=${coachSessions.count}, ENTRY_LOGS=${entryLogs.count}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
