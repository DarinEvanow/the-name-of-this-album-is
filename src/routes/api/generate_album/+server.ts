import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import { env } from '$env/dynamic/private';
import { CLOUDFLARE_API_TOKEN, DREAM_STUDIO_KEY } from '$lib/Env';
import { generateAlbumArt } from '$lib/generation/album_art_generation';

export const POST: RequestHandler = async ({ request }) => {
	let dreamStudioKey: string;
	let cloudflareApiToken: string;

	if (process.env.NODE_ENV === 'production') {
		dreamStudioKey = env?.DREAM_STUDIO_KEY ?? '';
		cloudflareApiToken = env?.CLOUDFLARE_API_TOKEN ?? '';
	} else {
		dreamStudioKey = DREAM_STUDIO_KEY;
		cloudflareApiToken = CLOUDFLARE_API_TOKEN;
	}

	const authHeader = request.headers.get('authorization');

	if (authHeader != `Bearer ${dreamStudioKey}`) {
		throw error(401, 'Invalid API Key');
	}

	const albumArtDataURI = await generateAlbumArt(dreamStudioKey, "test");
	const albumArtBase64 = albumArtDataURI.split(',')[1]
	const buffer = Buffer.from(albumArtBase64, "base64");
	fs.writeFileSync("/tmp/temp.jpg", buffer);

	const cloudflarePostBody = new FormData();
	const file = fs.readFileSync(("test.jpg"));
	cloudflarePostBody.append("file", new Blob([file]), "temp.jpg");

	const cloudflareResponse = await fetch("https://api.cloudflare.com/client/v4/accounts/f4abb62a7d46a5d84d5e9fc66310e6dd/images/v1", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${cloudflareApiToken}`,
		},
		body: cloudflarePostBody,
	});

	const cloudflareResponseJSON = await cloudflareResponse.json();

	fs.unlinkSync("/tmp/temp.jpg");

	return json({ imageUrl: cloudflareResponseJSON.result.variants[0] });
};
