const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Supabase using environment variables
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.post('/api/log', async (req, res) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    
    if (clientIp === '::1' || clientIp === '127.0.0.1') {
        clientIp = ''; // Fallback for local testing
    }

    let geoData = {
        ip: clientIp || 'Public IP Lookup',
        city: 'Unknown',
        region: 'Unknown',
        country: 'Unknown',
        org: 'Unknown',
        timezone: 'Unknown'
    };

    try {
        const apiUrl = clientIp ? `https://ipapi.co/${clientIp}/json/` : `https://ipapi.co/json/`;
        const response = await axios.get(apiUrl);
        
        if (response.data && !response.data.error) {
            geoData = {
                ip: response.data.ip || clientIp,
                city: response.data.city || 'Unknown',
                region: response.data.region || 'Unknown',
                country: response.data.country_name || 'Unknown',
                org: response.data.org || 'Unknown',
                timezone: response.data.timezone || 'Unknown'
            };
        }
    } catch (error) {
        console.error('Geolocation fetch error:', error.message);
    }

    // Insert record into the 'visitors' table inside your Supabase database
    try {
        const { error } = await supabase
            .from('visitors')
            .insert([
                {
                    ip: geoData.ip,
                    city: geoData.city,
                    region: geoData.region,
                    country: geoData.country,
                    org: geoData.org,
                    timezone: geoData.timezone,
                    user_agent: req.headers['user-agent'] || 'Unknown'
                }
            ]);

        if (error) {
            console.error('Supabase DB Error:', error.message);
        } else {
            console.log(`Successfully logged visit from IP: ${geoData.ip} (${geoData.city})`);
        }
    } catch (dbError) {
        console.error('Database connection exception:', dbError.message);
    }

    return res.status(200).json({ status: 'success' });
});

// Export handler for Vercel serverless execution
module.exports = app;