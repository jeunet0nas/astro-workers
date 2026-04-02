export type SectionItem = {
	title?: string;
	description?: string;
	href?: string;
	logo?: { src: string };
};

export type PageSection = {
	type: 'hero' | 'services' | 'textImage' | 'partners' | 'cta';
	title?: string;
	lead?: string;
	backgroundImage?: { src: string };
	image?: { src: string };
	overlayOpacity?: number;
	primaryCtaLabel?: string;
	primaryCtaHref?: string;
	secondaryCtaLabel?: string;
	secondaryCtaHref?: string;
	alignImageRight?: boolean;
	items?: SectionItem[];
};
