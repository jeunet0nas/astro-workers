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
			featured: z.boolean().optional(),
			category: z.string().optional(),
			tags: z.array(z.string()).optional(),
			readingTime: z.number().int().positive().optional(),
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
	schema: ({ image }) =>
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
			heroBackgroundImage: image().optional(),
			heroOverlayOpacity: z.number().min(0).max(1).optional(),
			sections: z
				.array(
					z.object({
						type: z.enum(['hero', 'services', 'textImage', 'partners', 'cta']),
						title: z.string().optional(),
						lead: z.string().optional(),
						backgroundImage: image().optional(),
						image: image().optional(),
						overlayOpacity: z.number().min(0).max(1).optional(),
						primaryCtaLabel: z.string().optional(),
						primaryCtaHref: z.string().optional(),
						secondaryCtaLabel: z.string().optional(),
						secondaryCtaHref: z.string().optional(),
						alignImageRight: z.boolean().optional(),
						items: z
							.array(
								z.object({
									title: z.string().optional(),
									description: z.string().optional(),
									href: z.string().optional(),
									logo: image().optional(),
								})
							)
							.optional(),
					})
				)
				.optional(),
		}),
});

export const collections = { posts, pages, sitePages };
