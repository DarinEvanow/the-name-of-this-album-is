import { Client, isFullPage } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export async function fetchLatestAlbum(key: string, databaseId: string) {
	const notion = new Client({ auth: key });

	const response = await notion.databases.query({
		database_id: databaseId
	});

	const fullPages: PageObjectResponse[] = response.results.filter(isFullPage);
	const latestAlbumProperties = fullPages[0].properties;

	return {
		title: latestAlbumProperties.album_name.rich_text[0].plain_text,
		art: latestAlbumProperties.album_art_src.rich_text[0].plain_text
	};
}
