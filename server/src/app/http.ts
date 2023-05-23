import axios from 'axios';
import rateLimit from 'axios-rate-limit';

export const URLConfig = {
    headers: {
        Authorization: 'Bearer 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'
    }
};

const http = rateLimit(axios.create(URLConfig), { maxRequests: 10, perMilliseconds: 60000, maxRPS: 1 })

export default http