import { config, collection, fields } from '@keystatic/core';

const postImageOpts = {
	directory: 'src/assets/images/posts',
	publicPath: '../../assets/images/posts/',
};

const pageImageOpts = {
	directory: 'src/assets/images/pages',
	publicPath: '../../assets/images/pages/',
};

export default config({
	storage: { kind: 'local' },
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
				content: fields.markdoc({
					label: 'Content',
					options: { image: pageImageOpts },
				}),
			},
		}),
	},
});
