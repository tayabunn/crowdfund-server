require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Campaign = require('./models/Campaign');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdfund';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for notification migration...');

  const notifications = await Notification.find({ actionRoute: '/dashboard/supporter-home' });
  console.log(`Found ${notifications.length} supporter notifications to migrate.`);

  let updatedCount = 0;
  for (const n of notifications) {
    let title = '';
    
    // Pattern 1: You contributed X credits to "Y".
    const match1 = n.message.match(/to "([^"]+)"/);
    if (match1) {
      title = match1[1];
    } else {
      // Pattern 2: Your contribution of X credits to Y was approved/rejected by Z
      const match2 = n.message.match(/credits to (.+?) was/);
      if (match2) {
        title = match2[1].trim();
      }
    }

    if (title) {
      const campaign = await Campaign.findOne({ title: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') });
      if (campaign) {
        n.actionRoute = `/explore/${campaign._id}`;
        await n.save();
        updatedCount++;
        console.log(`Migrated notification: "${n.message}" -> /explore/${campaign._id}`);
      } else {
        console.log(`Could not find campaign for title: "${title}"`);
      }
    } else {
      console.log(`Could not extract title from message: "${n.message}"`);
    }
  }

  console.log(`Successfully migrated ${updatedCount} notifications.`);
  mongoose.connection.close();
}

migrate().catch(console.error);
