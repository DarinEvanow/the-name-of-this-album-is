import { GenerationServiceClient } from '$lib/generation/generation_pb_service';
import Generation from '$lib/generation/generation_pb';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';
import pkg from '@improbable-eng/grpc-web';
const { grpc } = pkg;

grpc.setDefaultTransport(NodeHttpTransport());

function createRequest(albumArtPrompt: string) {
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
	promptText.setText(albumArtPrompt);

	request.addPrompt(promptText);

	return request;
}

function createMetadata(key: string) {
	// Authenticate using your API key
	const metadata = new grpc.Metadata();
	metadata.set('Authorization', 'Bearer ' + key);

	return metadata;
}

export async function generateAlbumArt(key: string, albumArtPrompt: string) {
	const request = createRequest(albumArtPrompt);
	const metadata = createMetadata(key);

	// Create a generation client
	const generationClient = new GenerationServiceClient('https://grpc.stability.ai', {});

	// Send the request using the `metadata` with our key from earlier
	const generation = generationClient.generate(request, metadata);

	const base64Image = await new Promise((resolve) => {
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

				resolve(base64Image);
			});
		});
	});

	// Anything other than `status.code === 0` is an error
	generation.on('status', (status) => {
		if (status.code === 0) return;
		console.error('Your image could not be generated. You might not have enough credits.');
	});

	return `data:image/png;base64,${base64Image}`;
}
