// index.js
import express from 'express';
import { createClient } from 'redis';
import axios from 'axios';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const port = process.env.PORT || 3000;

const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.connect().catch(console.error);

// Endpoint to add a message and set expiry
const botMessageArrived = async (channelUrl, messageCreatedAt) => {
    try {
        // Add to Key Value Storage
        await redisClient.set(channelUrl, messageCreatedAt);
        // Add to Sorted Set with expiry timestamp as score
        await redisClient.zAdd('channels', { score: messageCreatedAt, value: channelUrl });
    } catch (error) {
        console.error(error);
    }
}

app.post('/sendbird_message', async (req, res) => {
    res.status(200).send("OK");
    const { category, type, channel, sender, payload } = req.body;
    if (category === "group_channel:message_send" && type === "MESG") {
        if (sender.user_id === "swiggy" && payload.custom_type !== "CLOSE_CHANNEL") {
            await botMessageArrived(channel.channel_url, payload.created_at);
        }
    }
});

const baseURL = process.env.SENDBIRD_BASE_URL;
const apiToken = process.env.API_TOKEN;
const headers = {
    "Api-Token": apiToken,
    "Content-Type": "application/json"
};

const sendRequest = async (method, url, data = {}) => {
    try {
        await axios({ method, url, headers, data });
    } catch (error) {
        console.error(`Error processing ${url}: ${error}`);
        throw error; // Rethrow to handle it in the calling context if needed
    }
};

const processExpiredChannels = async (channelUrl) => {
    //Consider adding a queue to avoid hitting the API's rate limit.
    try {
        await sendRequest('post', `${baseURL}${channelUrl}/messages`, {
            user_id: "swiggy",
            message_type: "MESG",
            message: "This channel has been frozen due to inactivity"
        });
        await sendRequest('put', `${baseURL}${channelUrl}`, {
            custom_type: "CONVERSATION_CLOSED"
        });
        await sendRequest('put', `${baseURL}${channelUrl}/freeze`, {
            freeze: true
        });
    } catch (error) {
        console.error('Failed to process channel', error);
    }
};


// Scheduled job to delete expired channels, running every 15 seconds
cron.schedule('*/40 * * * * *', async () => {
    try {
        const beginDeleteFromSecondsAgo = Date.now() - 40 * 1000;
        const expiredChannels = await redisClient.zRangeByScore('channels', beginDeleteFromSecondsAgo, 8640000000000000);
        if (expiredChannels.length) {
            await Promise.all(expiredChannels.map(async (channelUrl) => {
                await Promise.all([
                    redisClient.zRem('channels', channelUrl),
                    redisClient.del(channelUrl),
                    processExpiredChannels(channelUrl)
                ]);
            }));
            console.log(`Deleted expired channels: ${expiredChannels}`);
        }
    } catch (error) {
        console.error('Error processing expired channels:', error);
    }
});



app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
