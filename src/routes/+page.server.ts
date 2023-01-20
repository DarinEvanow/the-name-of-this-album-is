import { env } from '$env/dynamic/private';
import { NOTION_KEY, NOTION_DATABASE_ID } from '$lib/Env';
import { Client, isFullPage } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

let notionKey: string;
let notionDatabaseId: string;

if (process.env.NODE_ENV === 'production') {
	notionKey = env?.NOTION_KEY ?? '';
	notionDatabaseId = env?.NOTION_DATABASE_ID ?? '';
} else {
	notionKey = NOTION_KEY;
	notionDatabaseId = NOTION_DATABASE_ID;
}

const notion = new Client({ auth: notionKey });

export async function load() {
	const response = await notion.databases.query({
		database_id: notionDatabaseId
	});

	const fullPages: PageObjectResponse[] = response.results.filter(isFullPage);

	return {
		album: {
			title: `${fullPages[0].properties.album_name.rich_text[0].plain_text}`
		}
	};
}
