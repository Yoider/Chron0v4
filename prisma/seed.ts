import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Clean the database
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.task.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.document.deleteMany();
  await prisma.traceLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create default user
  const passwordHash = await bcrypt.hash("password123", 10);
  const defaultUser = await prisma.user.create({
    data: {
      email: "dev@chron0v4.com",
      name: "Developer Principal",
      passwordHash,
    },
  });

  // Create wallets
  const cashWallet = await prisma.wallet.create({
    data: {
      userId: defaultUser.id,
      name: "Efectivo",
      icon: "💵",
    },
  });

  const cardWallet = await prisma.wallet.create({
    data: {
      userId: defaultUser.id,
      name: "Tarjeta Santander",
      icon: "💳",
    },
  });

  // 1. Create CHRON0V4 Meta-Project linked to the user
  const chron0v4Project = await prisma.project.create({
    data: {
      name: "CHRON0V4 (Chrononova)",
      description: "Proyecto de trazabilidad y preservación de contexto para desarrolladores. (Seguimiento de desarrollo interno)",
      userId: defaultUser.id,
    },
  });

  // 1.1 TraceLogs (History of development from start to current point)
  await prisma.traceLog.createMany({
    data: [
      {
        projectId: chron0v4Project.id,
        lastState: "Esquematización del MVP y diseño de modelos de base de datos.",
        nextSteps: "Enlazar base de datos Postgres cloud con Prisma ORM.",
        createdAt: new Date(Date.now() - 4 * 3600000), // 4 hours ago
      },
      {
        projectId: chron0v4Project.id,
        lastState: "Instalación de dependencias de Prisma, vinculación de Postgres, y ejecución de migraciones de base de datos exitosas.",
        nextSteps: "Crear estructura de Next.js App Router y maquetar interfaz inicial de 3 columnas.",
        createdAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      },
      {
        projectId: chron0v4Project.id,
        lastState: "Next.js inicializado. Creadas las APIs backend de CRUD de Proyectos, Documentos, Metas, y Tareas. Integrado el frontend premium de 3 columnas con modo oscuro nativo.",
        nextSteps: "Comenzar el diseño y especificación de la Fase 2: Autenticación de Usuarios.",
        createdAt: new Date(), // current time
      },
    ],
  });

  // 1.2 Documents (Modular Documentation using Diataxis Philosophy)
  await prisma.document.createMany({
    data: [
      {
        projectId: chron0v4Project.id,
        title: "Arquitectura de Software y Decisiones Técnicas",
        type: "EXPLANATION",
        content: "# Arquitectura de CHRON0V4\n\nCHRON0V4 está construido como un entorno local premium monousuario sobre Next.js (App Router) y TypeScript.\n\n## Decisiones de Diseño:\n- **Prisma Postgres**: Permite persistir de forma relacional y tipada el grafo de datos (Proyectos -> Metas -> Tareas).\n- **Modo Oscuro Nativo**: Optimizado para minimizar la fatiga visual del desarrollador durante sesiones de alta carga cognitiva.",
        createdAt: new Date(Date.now() - 3 * 3600000),
      },
      {
        projectId: chron0v4Project.id,
        title: "Variables de Entorno y Variables del Sistema",
        type: "REFERENCE",
        content: "# Referencia Técnica\n\n## Variables de Entorno (.env):\n- `DATABASE_URL`: Cadena de conexión segura provista por Prisma Postgres.\n- `PORT`: Servidor por defecto en el puerto 3000.\n\n## Versiones de Dependencias:\n- Next.js v16+\n- React v19\n- Tailwind CSS v4",
        createdAt: new Date(Date.now() - 3 * 3600000),
      },
      {
        projectId: chron0v4Project.id,
        title: "Pasos para Desplegar y Compilar en Producción",
        type: "GUIDE",
        content: "# Guía de Despliegue\n\nSigue estos pasos para compilar en limpio el proyecto:\n\n1. Asegúrate de tener las variables configuradas en el archivo `.env`.\n2. Genera los tipos de Prisma Client: `npx prisma generate`.\n3. Ejecuta el comando de compilación: `npm run build`.\n4. Levanta el servidor optimizado de producción: `npm run start`.",
        createdAt: new Date(Date.now() - 3 * 3600000),
      },
    ],
  });

  // 1.3 Goals (Milestones)
  const goal1 = await prisma.goal.create({
    data: {
      projectId: chron0v4Project.id,
      title: "Configuración Inicial de Base de Datos y Framework",
      description: "Establecer la infraestructura inicial (Prisma Postgres, dependencias, e inicialización de Next.js)",
      progress: 100.0,
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      projectId: chron0v4Project.id,
      title: "Interfaz de Usuario Premium y Backend CRUD",
      description: "Estructura de 3 columnas (Modo Oscuro) e integración de endpoints API de proyectos",
      progress: 100.0,
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      projectId: chron0v4Project.id,
      title: "Sistema de Autenticación de Cuentas",
      description: "Agregar login, registro y protección de rutas para entornos multiusuario/personales",
      progress: 0.0,
    },
  });

  // 1.4 Tasks (To-Dos linked to Goals)
  await prisma.task.createMany({
    data: [
      {
        projectId: chron0v4Project.id,
        goalId: goal1.id,
        title: "Instalar dependencias e inicializar Prisma",
        status: "COMPLETED",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal1.id,
        title: "Vincular base de datos PostgreSQL con clave API",
        status: "COMPLETED",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal1.id,
        title: "Crear migración de base de datos inicial (init)",
        status: "COMPLETED",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal2.id,
        title: "Scaffolding del proyecto Next.js App Router",
        status: "COMPLETED",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal2.id,
        title: "Desarrollar vistas CRUD de Proyectos y Layout en modo oscuro",
        status: "COMPLETED",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal2.id,
        title: "Escribir endpoints API para TraceLogs, Documentación y Tareas",
        status: "COMPLETED",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal3.id,
        title: "Diseñar flujo de registro y login de usuarios",
        status: "PENDING",
      },
      {
        projectId: chron0v4Project.id,
        goalId: goal3.id,
        title: "Implementar middleware de sesión / JWT para protección de rutas",
        status: "PENDING",
      },
    ],
  });

  // 1.5 Transactions (Finances seed data)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Create transactions spread across the months
  await prisma.transaction.createMany({
    data: [
      {
        userId: defaultUser.id,
        projectId: chron0v4Project.id,
        walletId: cardWallet.id,
        amount: 3200,
        type: "INCOME",
        category: "Freelance",
        icon: "💻",
        description: "Desarrollo MVP Cliente A",
        date: new Date(currentYear, 0, 15), // Ene
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 150,
        type: "EXPENSE",
        category: "Hosting/Cloud",
        icon: "☁️",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Factura Mensual AWS",
        date: new Date(currentYear, 0, 18), // Ene
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 80,
        type: "EXPENSE",
        category: "Licencias/Software",
        icon: "🤖",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Suscripción Copilot & Github",
        date: new Date(currentYear, 0, 20), // Ene
      },

      {
        userId: defaultUser.id,
        projectId: chron0v4Project.id,
        walletId: cardWallet.id,
        amount: 3500,
        type: "INCOME",
        category: "Freelance",
        icon: "💻",
        description: "Hito 1 Backend Reengineering",
        date: new Date(currentYear, 1, 10), // Feb
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 150,
        type: "EXPENSE",
        category: "Hosting/Cloud",
        icon: "☁️",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Factura Mensual AWS",
        date: new Date(currentYear, 1, 18), // Feb
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 300,
        type: "EXPENSE",
        category: "Hardware",
        icon: "⌨️",
        recurrence: "ONE_TIME",
        status: "PAID",
        description: "Teclado mecánico nuevo",
        date: new Date(currentYear, 1, 22), // Feb
      },

      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 3000,
        type: "INCOME",
        category: "Sueldo",
        icon: "💰",
        description: "Nómina Consultora Tech",
        date: new Date(currentYear, 2, 5), // Mar
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 150,
        type: "EXPENSE",
        category: "Hosting/Cloud",
        icon: "☁️",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Factura Mensual AWS",
        date: new Date(currentYear, 2, 18), // Mar
      },
      {
        userId: defaultUser.id,
        walletId: cashWallet.id,
        amount: 450,
        type: "EXPENSE",
        category: "Alimentación",
        icon: "🛒",
        recurrence: "ONE_TIME",
        status: "PAID",
        description: "Compra mensual supermercado",
        date: new Date(currentYear, 2, 25), // Mar
      },

      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 4000,
        type: "INCOME",
        category: "Freelance",
        icon: "💼",
        description: "Consultoría de Arquitectura",
        date: new Date(currentYear, 3, 12), // Abr
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 200,
        type: "EXPENSE",
        category: "Hosting/Cloud",
        icon: "☁️",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Factura Mensual AWS & Vercel",
        date: new Date(currentYear, 3, 18), // Abr
      },

      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 4500,
        type: "INCOME",
        category: "Sueldo",
        icon: "💰",
        description: "Bono por Desempeño Consultora",
        date: new Date(currentYear, 4, 5), // May
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 200,
        type: "EXPENSE",
        category: "Hosting/Cloud",
        icon: "☁️",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Factura Mensual AWS",
        date: new Date(currentYear, 4, 18), // May
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 1200,
        type: "EXPENSE",
        category: "Hardware",
        icon: "🖥️",
        recurrence: "ONE_TIME",
        status: "PAID",
        description: "Monitor Ultrawide 4K",
        date: new Date(currentYear, 4, 25), // May
      },

      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 4200,
        type: "INCOME",
        category: "Sueldo",
        icon: "💼",
        description: "Nómina Consultora Tech",
        date: new Date(currentYear, 5, 5), // Jun
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 250,
        type: "EXPENSE",
        category: "Hosting/Cloud",
        icon: "☁️",
        recurrence: "SUBSCRIPTION",
        status: "PAID",
        description: "Factura AWS + Dominios",
        date: new Date(currentYear, 5, 18), // Jun
      },
      {
        userId: defaultUser.id,
        walletId: cashWallet.id,
        amount: 180,
        type: "EXPENSE",
        category: "Servicios",
        icon: "🔌",
        recurrence: "BILL",
        status: "PAID",
        description: "Fibra óptica y electricidad oficina",
        date: new Date(currentYear, 5, 20), // Jun
      },

      // Pending / En espera Expenses
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 80,
        type: "EXPENSE",
        category: "Servicios",
        icon: "🔌",
        recurrence: "BILL",
        status: "PENDING",
        description: "Factura de Internet (Siguiente mes)",
        date: new Date(currentYear, 6, 5), // Jul 5
      },
      {
        userId: defaultUser.id,
        walletId: cardWallet.id,
        amount: 15,
        type: "EXPENSE",
        category: "Licencias/Software",
        icon: "🤖",
        recurrence: "SUBSCRIPTION",
        status: "PENDING",
        description: "Suscripción Copilot (En espera)",
        date: new Date(currentYear, 6, 10), // Jul 10
      },
      {
        userId: defaultUser.id,
        walletId: cashWallet.id,
        amount: 350,
        type: "EXPENSE",
        category: "Alimentación",
        icon: "🛒",
        recurrence: "ONE_TIME",
        status: "PENDING",
        description: "Compra Mercadona semanal",
        date: new Date(currentYear, 6, 12), // Jul 12
      },
    ],
  });

  console.log("✅ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
