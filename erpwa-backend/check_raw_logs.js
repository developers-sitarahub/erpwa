import axios from 'axios';

// I'll try to bypass auth if possible, but probably not.
// Instead, I'll look at the data in the database directly to see if I missed any field.

import prisma from './src/prisma.js';

async function main() {
  const logs = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error);
