import { env } from '$env/dynamic/private';
import { NOTION_KEY, NOTION_DATABASE_ID, DREAM_STUDIO_KEY } from '$lib/Env';
import { fetchLatestAlbum } from '$lib/notion/database';

let notionKey: string;
let notionDatabaseId: string;
let dreamStudioKey: string;

if (process.env.NODE_ENV === 'production') {
	notionKey = env?.NOTION_KEY ?? '';
	notionDatabaseId = env?.NOTION_DATABASE_ID ?? '';
} else {
	notionKey = NOTION_KEY;
	notionDatabaseId = NOTION_DATABASE_ID;
}

export async function load() {
	const album = await fetchLatestAlbum(notionKey, notionDatabaseId);

	return {
		album: {
			title: album.title,
			image: album.art
		}
	};
}
