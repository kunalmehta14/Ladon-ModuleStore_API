import { pipeline } from '@huggingface/transformers';

async function processText(input: string){
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2');
  const output = await extractor(input, {
      pooling: 'mean',
      normalize: true,
  });
  const embeddings = output.tolist();
  return embeddings;
};
