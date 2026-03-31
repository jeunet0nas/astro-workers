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
			showInHeader: z.boolean().optional(),
			navLabel: z.string().optional(),
			navOrder: z.number().optional(),
		}),
});

const sitePages = defineCollection({
	loader: glob({ pattern: '**/*.mdoc', base: './src/content/site-pages' }),
	schema: () =>
		z.object({
			key: z.string(),
			pageTitle: z.string(),
			pageDescription: z.string().optional(),
			showInHeader: z.boolean().optional(),
			navLabel: z.string().optional(),
			navOrder: z.number().optional(),
			heroTitle: z.string().optional(),
			heroLead: z.string().optional(),
			primaryCtaLabel: z.string().optional(),
			primaryCtaHref: z.string().optional(),
			secondaryCtaLabel: z.string().optional(),
			secondaryCtaHref: z.string().optional(),
		}),
});

export const collections = { posts, pages, sitePages };
