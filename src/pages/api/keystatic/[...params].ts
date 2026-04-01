/**
 * Custom Keystatic API handler for Astro 6 + Cloudflare Workers.
 * 
 * Astro 6 removed `Astro.locals.runtime.env` which Keystatic's default handler relies on.
 * This custom handler uses the new `cloudflare:workers` import to access environment variables.
 */
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import { parseString } from 'set-cookie-parser';
import config from 'virtual:keystatic-config';

// Import Cloudflare env using the new Astro 6 way
import { env } from 'cloudflare:workers';

export const prerender = false;

export const ALL = async (context: import('astro').APIContext) => {
	const handler = makeGenericAPIRouteHandler(
		{
			config,
			clientId: env.KEYSTATIC_GITHUB_CLIENT_ID,
			clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET,
			secret: env.KEYSTATIC_SECRET,
		},
		{
			slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
		}
	);

	const { body, headers, status } = await handler(context.request);

	// Process headers (same logic as original Keystatic handler)
	const headersInADifferentStructure = new Map<string, string[]>();
	if (headers) {
		if (Array.isArray(headers)) {
			for (const [key, value] of headers) {
				if (!headersInADifferentStructure.has(key.toLowerCase())) {
					headersInADifferentStructure.set(key.toLowerCase(), []);
				}
				headersInADifferentStructure.get(key.toLowerCase())!.push(value);
			}
		} else if (typeof (headers as Headers).entries === 'function') {
			for (const [key, value] of (headers as Headers).entries()) {
				headersInADifferentStructure.set(key.toLowerCase(), [value]);
			}
			if (
				'getSetCookie' in headers &&
				typeof (headers as Headers).getSetCookie === 'function'
			) {
				const setCookieHeaders = (headers as Headers).getSetCookie();
				if (setCookieHeaders?.length) {
					headersInADifferentStructure.set('set-cookie', setCookieHeaders);
				}
			}
		} else {
			for (const [key, value] of Object.entries(headers)) {
				headersInADifferentStructure.set(key.toLowerCase(), [value as string]);
			}
		}
	}

	// Handle Set-Cookie headers
	const setCookieHeaders = headersInADifferentStructure.get('set-cookie');
	headersInADifferentStructure.delete('set-cookie');
	if (setCookieHeaders) {
		for (const setCookieValue of setCookieHeaders) {
			const { name, value, ...options } = parseString(setCookieValue);
			const sameSite = options.sameSite?.toLowerCase();
			context.cookies.set(name, value, {
				domain: options.domain,
				expires: options.expires,
				httpOnly: options.httpOnly,
				maxAge: options.maxAge,
				path: options.path,
				sameSite:
					sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none'
						? sameSite
						: undefined,
			});
		}
	}

	return new Response(body, {
		status,
		headers: [...headersInADifferentStructure.entries()].flatMap(([key, val]) =>
			val.map((x) => [key, x])
		),
	});
};

export const all = ALL;
