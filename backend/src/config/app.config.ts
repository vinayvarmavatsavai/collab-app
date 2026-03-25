import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
        embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
        embeddingDimensions: parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || '768', 10),
    },
}));
