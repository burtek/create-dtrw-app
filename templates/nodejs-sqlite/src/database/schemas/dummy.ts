import { integer, sqliteTable as table, text } from 'drizzle-orm/sqlite-core';


export const dummy = table('dummy', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull()
});

export type SelectDummy = typeof dummy.$inferSelect;
export type InsertDummy = typeof dummy.$inferInsert;
