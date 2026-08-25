# SHIFT Final

A private team hub for Kash, Usama, Patrick and Param.

## What works

All visible buttons perform an action.
Profile and topic edits survive refresh through local storage.
The next host is calculated from the rotation automatically.
The countdown uses the saved next session timestamp.
The next host card is visually stronger.
Suggested topics are attached to each person.
Future uses slowly moving bubbles.
Library collections are editable by the admin.
Kash is the admin identity.
The interface is responsive and respects reduced motion.

## Team wide persistence on Vercel

The app contains an API route that supports Upstash Redis through Vercel.

Add an Upstash Redis integration to the Vercel project so the deployment receives either:

UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

or

KV_REST_API_URL and KV_REST_API_TOKEN

Redeploy once after adding the integration.

When cloud storage is connected, the lower left save status changes to Saved for the team. Until then all changes are saved on the current device and survive refresh.

## Deploy

Upload all files in this folder to the root of the GitHub repository. Vercel will redeploy automatically.
