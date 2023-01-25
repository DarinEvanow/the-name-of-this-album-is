import { env } from '$env/dynamic/private';
import { NOTION_KEY, NOTION_DATABASE_ID, DREAM_STUDIO_KEY } from '$lib/Env';
import { fetchLatestAlbumTitle } from '$lib/notion/database';
import { generateAlbumArt } from '$lib/generation/album_art_generation';

let notionKey: string;
let notionDatabaseId: string;
let dreamStudioKey: string;

if (process.env.NODE_ENV === 'production') {
	notionKey = env?.NOTION_KEY ?? '';
	notionDatabaseId = env?.NOTION_DATABASE_ID ?? '';
	dreamStudioKey = env?.DREAM_STUDIO_KEY ?? '';
} else {
	notionKey = NOTION_KEY;
	notionDatabaseId = NOTION_DATABASE_ID;
	dreamStudioKey = DREAM_STUDIO_KEY;
}

export async function load() {
	const albumTitle = await fetchLatestAlbumTitle(notionKey, notionDatabaseId);
	const albumArt = await generateAlbumArt(dreamStudioKey, albumTitle);

	return {
		album: {
			title: albumTitle,
			image: albumArt
		}
	};
}
