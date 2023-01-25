import { Client, isFullPage } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export async function fetchLatestAlbumTitle(key: string, databaseId: string) {
	const notion = new Client({ auth: key });

	const response = await notion.databases.query({
		database_id: databaseId
	});

	const fullPages: PageObjectResponse[] = response.results.filter(isFullPage);
	return fullPages[0].properties.album_name.rich_text[0].plain_text;
}
