import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const blogPosts=sqliteTable('blog_posts',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),title:text('title').notNull(),category:text('category').notNull(),excerpt:text('excerpt').notNull(),body:text('body').notNull(),status:text('status').notNull().default('draft'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),publishedAt:text('published_at'),revision:integer('revision').notNull().default(1)
},table=>[index('posts_status_published').on(table.status,table.publishedAt),index('posts_owner').on(table.ownerId)]);
