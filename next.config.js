/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'kandwedeqpguuupzqpcc.supabase.co',
            },
        ],
    }
};

module.exports = nextConfig;
