import { env } from '$env/dynamic/private';
import { NOTION_KEY, NOTION_DATABASE_ID } from '$lib/Env';
import { Client } from '@notionhq/client';

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

	return {
		album: {
			title: `${response.results[0].properties.album_name.rich_text[0].plain_text}`
		}
	};
}
