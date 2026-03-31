import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.mdoc', base: './src/content/posts' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			publishDate: z.coerce.date(),
			summary: z.string().optional(),
			draft: z.boolean().optional(),
			coverImage: image().optional(),
		}),
});

const pages = defineCollection({
	loader: glob({ pattern: '**/*.mdoc', base: './src/content/pages' }),
	schema: () =>
		z.object({
			title: z.string(),
		}),
});

export const collections = { posts, pages };
