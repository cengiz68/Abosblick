import { PrismaClient } from "@prisma/client";
export const testDb = new PrismaClient({ datasources: { db: { url: "file:./test.db" } } });
export async function reset() {
  await testDb.reminderLog.deleteMany();
  await testDb.contract.deleteMany();
  await testDb.uploadedFile.deleteMany();
  await testDb.user.updateMany({ data: { householdId: null } });
  await testDb.household.deleteMany();
  await testDb.user.deleteMany();
}
export const makeUser = (email = "anna@example.ch", extra = {}) =>
  testDb.user.create({ data: { email, name: "Anna Muster", passwordHash: "x", street: "Bahnhofstrasse 1", zip: "8001", city: "Zürich", ...extra } });
