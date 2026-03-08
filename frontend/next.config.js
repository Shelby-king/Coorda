/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gateway.lighthouse.storage', 'avatars.githubusercontent.com'],
  },
};

module.exports = nextConfig;
