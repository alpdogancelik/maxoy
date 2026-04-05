const bcrypt = require("bcryptjs");
const { PrismaClient, RoleName } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const roles = [RoleName.ADMIN, RoleName.EDITOR, RoleName.VIEWER, RoleName.ORDER_MANAGER];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
  if (!adminRole) {
    throw new Error("Admin role missing after upsert");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: "Maxoy Admin",
      passwordHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log(`Admin user is ready: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
