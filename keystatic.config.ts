import { config, collection, fields } from '@keystatic/core';

const postImageOpts = {
	directory: 'src/assets/images/posts',
	publicPath: '../../assets/images/posts/',
};

const pageImageOpts = {
	directory: 'src/assets/images/pages',
	publicPath: '../../assets/images/pages/',
};

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
	?.env ?? { KEYSTATIC_STORAGE_KIND: 'local' };

const storageKind = env.KEYSTATIC_STORAGE_KIND ?? 'local';
const githubRepo = env.KEYSTATIC_GITHUB_REPO;
const githubBranchPrefix = env.KEYSTATIC_GITHUB_BRANCH_PREFIX;
const [repoOwner = 'jeunet0nas', repoName = 'astro-workers'] = (
	githubRepo ?? 'jeunet0nas/astro-workers'
).split('/');

const storage =
	storageKind === 'github'
		? {
				kind: 'github' as const,
				repo: { owner: repoOwner, name: repoName },
				...(githubBranchPrefix ? { branchPrefix: githubBranchPrefix } : {}),
			}
		: { kind: 'local' as const };

export default config({
	storage,
	collections: {
		posts: collection({
			label: 'Blog posts',
			slugField: 'title',
			path: 'src/content/posts/*',
			format: { contentField: 'content' },
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				publishDate: fields.date({
					label: 'Publish date',
					defaultValue: { kind: 'today' },
				}),
				summary: fields.text({
					label: 'Summary',
					multiline: true,
				}),
				draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
				coverImage: fields.image({
					label: 'Cover image',
					...postImageOpts,
				}),
				content: fields.markdoc({
					label: 'Content',
					options: { image: postImageOpts },
				}),
			},
		}),
		pages: collection({
			label: 'Pages',
			slugField: 'title',
			path: 'src/content/pages/*',
			format: { contentField: 'content' },
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				showInHeader: fields.checkbox({
					label: 'Show in header menu',
					defaultValue: true,
				}),
				navLabel: fields.text({
					label: 'Header label',
					description: 'If empty, title will be used.',
				}),
				navOrder: fields.integer({
					label: 'Header order',
					defaultValue: 100,
				}),
				content: fields.markdoc({
					label: 'Content',
					options: { image: pageImageOpts },
				}),
			},
		}),
		sitePages: collection({
			label: 'Site pages',
			slugField: 'key',
			path: 'src/content/site-pages/*',
			format: { contentField: 'content' },
			schema: {
				key: fields.slug({ name: { label: 'Key (home/blog)' } }),
				pageTitle: fields.text({ label: 'Page title' }),
				pageDescription: fields.text({
					label: 'Page description',
					multiline: true,
				}),
				showInHeader: fields.checkbox({
					label: 'Show in header menu',
					defaultValue: true,
				}),
				navLabel: fields.text({
					label: 'Header label',
					description: 'If empty, page title will be used.',
				}),
				navOrder: fields.integer({
					label: 'Header order',
					defaultValue: 10,
				}),
				heroTitle: fields.text({
					label: 'Hero title',
					multiline: true,
				}),
				heroLead: fields.text({
					label: 'Hero lead',
					multiline: true,
				}),
				primaryCtaLabel: fields.text({ label: 'Primary CTA label' }),
				primaryCtaHref: fields.text({ label: 'Primary CTA href' }),
				secondaryCtaLabel: fields.text({ label: 'Secondary CTA label' }),
				secondaryCtaHref: fields.text({ label: 'Secondary CTA href' }),
				content: fields.markdoc({
					label: 'Body content',
					options: { image: pageImageOpts },
				}),
			},
		}),
	},
});
