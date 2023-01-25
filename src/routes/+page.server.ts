import { env } from '$env/dynamic/private';
import { NOTION_KEY, NOTION_DATABASE_ID, DREAM_STUDIO_KEY } from '$lib/Env';
import { Client, isFullPage } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
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

const notion = new Client({ auth: notionKey });

export async function load() {
	const response = await notion.databases.query({
		database_id: notionDatabaseId
	});

	const fullPages: PageObjectResponse[] = response.results.filter(isFullPage);
	const albumTitle = fullPages[0].properties.album_name.rich_text[0].plain_text;
	const albumArt = await generateAlbumArt(dreamStudioKey, albumTitle);

	return {
		album: {
			title: albumTitle,
			image: albumArt
		}
	};
}
