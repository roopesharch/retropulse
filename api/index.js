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

// Helper function to get current date/time formatted specifically for IST (Bengaluru / Chennai)
function getISTTimestamp() {
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(now).replace(',', '');
}

app.post('/api/log', async (req, res) => {
    // Check if the request origin/path indicates the game route
    const requestPath = req.headers['referer'] || req.body.path || '';
    const isGameRoute = requestPath.includes('/game');

    // If it's not the /game route, skip tracking entirely
    if (!isGameRoute) {
        return res.status(200).json({ status: 'skipped', message: 'Not on /game path' });
    }

    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    
    if (clientIp === '::1' || clientIp === '127.0.0.1') {
        clientIp = '127.0.0.1'; // Standardize local testing IP
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
        const apiUrl = clientIp !== '127.0.0.1' ? `https://ipapi.co/${clientIp}/json/` : `https://ipapi.co/json/`;
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

    try {
        // Fetch current user row to safely increment the counter
        const { data: existingUser, error: fetchError } = await supabase
            .from('visitors')
            .select('update_count, created_at')
            .eq('ip', geoData.ip)
            .maybeSingle();

        if (fetchError) {
            console.error('Supabase fetch error:', fetchError.message);
        }

        let currentCount = 0;
        if (existingUser && typeof existingUser.update_count === 'number') {
            currentCount = existingUser.update_count;
        }
        const newCount = currentCount + 1;

        const istTime = getISTTimestamp();

        // Prepare object payload
        const payload = {
            ip: geoData.ip,
            city: geoData.city,
            region: geoData.region,
            country: geoData.country,
            org: geoData.org,
            timezone: geoData.timezone,
            user_agent: req.headers['user-agent'] || 'Unknown',
            update_count: newCount,
            updated_at: istTime
        };

        if (!existingUser || !existingUser.created_at) {
            payload.created_at = istTime;
        }

        // Perform upsert
        const { error: upsertError } = await supabase
            .from('visitors')
            .upsert([payload], { onConflict: 'ip' });

        if (upsertError) {
            console.error('Supabase DB Upsert Error:', upsertError.message);
            return res.status(500).json({ status: 'error', message: upsertError.message });
        } else {
            console.log(`Successfully updated visit for IP: ${geoData.ip} | Count: ${newCount} | Time (IST): ${istTime}`);
        }
    } catch (dbError) {
        console.error('Database connection exception:', dbError.message);
        return res.status(500).json({ status: 'error', message: dbError.message });
    }

    return res.status(200).json({ status: 'success' });
});

// Export handler for Vercel serverless execution
module.exports = app;