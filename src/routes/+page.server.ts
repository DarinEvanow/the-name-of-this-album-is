import { env } from '$env/dynamic/private';
import { NOTION_KEY, NOTION_DATABASE_ID, DREAM_STUDIO_KEY } from '$lib/Env';
import { Client, isFullPage } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { GenerationServiceClient } from '$lib/generation/generation_pb_service';
import Generation from '$lib/generation/generation_pb';
import { grpc } from '@improbable-eng/grpc-web';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

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

grpc.setDefaultTransport(NodeHttpTransport());

// Set up image parameters
const imageParams = new Generation.ImageParameters();
imageParams.setWidth(512);
imageParams.setHeight(512);
imageParams.addSeed(123);
imageParams.setSamples(1);
imageParams.setSteps(50);

// Use the `k-dpmpp-2` sampler
const transformType = new Generation.TransformType();
transformType.setDiffusion(Generation.DiffusionSampler.SAMPLER_K_DPMPP_2M);
imageParams.setTransform(transformType);

// Use Stable Diffusion 2.0
const request = new Generation.Request();
request.setEngineId('stable-diffusion-512-v2-1');
request.setRequestedType(Generation.ArtifactType.ARTIFACT_IMAGE);
request.setClassifier(new Generation.ClassifierParameters());

// Use a CFG scale of `13`
const samplerParams = new Generation.SamplerParameters();
samplerParams.setCfgScale(13);

const stepParams = new Generation.StepParameter();
const scheduleParameters = new Generation.ScheduleParameters();

// Set the schedule to `0`, this changes when doing an initial image generation
stepParams.setScaledStep(0);
stepParams.setSampler(samplerParams);
stepParams.setSchedule(scheduleParameters);

imageParams.addParameters(stepParams);
request.setImage(imageParams);

// Set our text prompt
const promptText = new Generation.Prompt();
promptText.setText('Album cover for a synth funk band named Funk Lord Master Scrunko');

request.addPrompt(promptText);

// Authenticate using your API key, don't commit your key to a public repository!
const metadata = new grpc.Metadata();
metadata.set('Authorization', 'Bearer ' + dreamStudioKey);

// Create a generation client
const generationClient = new GenerationServiceClient('https://grpc.stability.ai', {});

export async function load() {
	const response = await notion.databases.query({
		database_id: notionDatabaseId
	});

	// Send the request using the `metadata` with our key from earlier
	const generation = generationClient.generate(request, metadata);

	let { base64Image, seed } = await new Promise((resolve) => {
		// Set up a callback to handle data being returned
		generation.on('data', (data) => {
			data.getArtifactsList().forEach((artifact) => {
				// Oh no! We were filtered by the NSFW classifier!
				if (
					artifact.getType() === Generation.ArtifactType.ARTIFACT_TEXT &&
					artifact.getFinishReason() === Generation.FinishReason.FILTER
				) {
					return console.error('Your image was filtered by the NSFW classifier.');
				}

				// Make sure we have an image
				if (artifact.getType() !== Generation.ArtifactType.ARTIFACT_IMAGE) return;

				// You can convert the raw binary into a base64 string
				const base64Image = btoa(
					new Uint8Array(artifact.getBinary()).reduce(
						(data, byte) => data + String.fromCodePoint(byte),
						''
					)
				);

				// Here's how you get the seed back if you set it to `0` (random)
				const seed = artifact.getSeed();

				resolve({ base64Image, seed });
			});
		});
	});

	// Anything other than `status.code === 0` is an error
	generation.on('status', (status) => {
		if (status.code === 0) return;
		console.error('Your image could not be generated. You might not have enough credits.');
	});

	const fullPages: PageObjectResponse[] = response.results.filter(isFullPage);

	return {
		album: {
			title: `${fullPages[0].properties.album_name.rich_text[0].plain_text}`,
			image: `data:image/png;base64,${base64Image}`
		}
	};
}
