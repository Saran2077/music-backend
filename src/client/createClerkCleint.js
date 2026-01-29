import { createClerkClient } from '@clerk/backend';

let clerkClient = null;

export function getClerkClient() {
  if (!clerkClient) {
    clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  return clerkClient;
}


