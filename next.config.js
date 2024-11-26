/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'www.approvedboats.com',
      'images.boattrader.com',
      'images.boatsgroup.com',
      'res.cloudinary.com'
    ],
    unoptimized: true,
  },
  // output: 'export',
}

module.exports = nextConfig