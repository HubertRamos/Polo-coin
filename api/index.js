import app from '../server.js';

/**
 * Ponto de entrada das Serverless Functions na Vercel.
 * Encaminha todas as requisições para a aplicação Express.
 */
export default function handler(req, res) {
    return app(req, res);
}
