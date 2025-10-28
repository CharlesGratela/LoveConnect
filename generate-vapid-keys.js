#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push Notifications
 * Run this script with: node generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('Add these to your .env.local file:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:support@nxtdate.com\n');

console.log('⚠️  IMPORTANT:');
console.log('1. Copy the keys above to your .env.local file');
console.log('2. Never commit VAPID_PRIVATE_KEY to version control');
console.log('3. Add the same keys to your Vercel environment variables');
console.log('4. Restart your development server after adding the keys\n');
