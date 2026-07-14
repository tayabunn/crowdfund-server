require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdfund';

const mockCampaigns = [
  {
    title: "Help us build a solar-powered water pump",
    story: "We are building a solar-powered water pump to provide clean drinking water to remote villages. Your support will help us buy materials and hire local workers.",
    category: "Technology",
    funding_goal: 50000,
    minimum_contribution: 10,
    deadline: new Date("2026-12-31"),
    reward_info: "Free water for life, sticker pack",
    image_url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
    status: "approved",
    creator_name: "Tech for Good",
    creator_email: "techforgood@mailinator.com",
    amount_raised: 37500
  },
  {
    title: "Community Art Center Renovation",
    story: "Our community art center needs a major renovation. We want to repaint, buy new supplies, and hold free classes for kids.",
    category: "Art",
    funding_goal: 15000,
    minimum_contribution: 5,
    deadline: new Date("2026-10-15"),
    reward_info: "Your name on the wall of patrons",
    image_url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    status: "approved",
    creator_name: "Local Artists United",
    creator_email: "artists@mailinator.com",
    amount_raised: 12000
  },
  {
    title: "Provide Clean Drinking Water to Remote Villages",
    story: "Thousands of people in remote villages lack access to clean drinking water. Help us drill wells and set up water purification systems.",
    category: "Community",
    funding_goal: 100000,
    minimum_contribution: 25,
    deadline: new Date("2026-11-20"),
    reward_info: "Personalized thank you video, updates",
    image_url: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=800&q=80",
    status: "approved",
    creator_name: "Water for All",
    creator_email: "water@mailinator.com",
    amount_raised: 45000
  },
  {
    title: "Emergency Medical Relief Fund",
    story: "Providing emergency medical relief to areas affected by natural disasters. We need funds for medicine, medical tents, and supplies.",
    category: "Health",
    funding_goal: 250000,
    minimum_contribution: 50,
    deadline: new Date("2026-08-30"),
    reward_info: "Relief reporter updates, certificate",
    image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
    status: "approved",
    creator_name: "Global Medics",
    creator_email: "medics@mailinator.com",
    amount_raised: 210000
  },
  {
    title: "Smart Greenhouse for Urban Agriculture",
    story: "An automated smart greenhouse project to grow fresh organic vegetables in urban areas year-round with minimal water usage.",
    category: "Technology",
    funding_goal: 30000,
    minimum_contribution: 15,
    deadline: new Date("2026-09-30"),
    reward_info: "Fresh produce basket, project blueprint",
    image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80",
    status: "approved",
    creator_name: "EcoGrow Tech",
    creator_email: "ecogrow@mailinator.com",
    amount_raised: 15000
  },
  {
    title: "Starlight Theater Summer Play Festival",
    story: "Help our independent theater group host a summer play festival to showcase local playwrights and actors.",
    category: "Art",
    funding_goal: 8000,
    minimum_contribution: 10,
    deadline: new Date("2026-07-25"),
    reward_info: "VIP tickets to all plays, festival t-shirt",
    image_url: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    status: "approved",
    creator_name: "Starlight Players",
    creator_email: "starlight@mailinator.com",
    amount_raised: 6200
  },
  {
    title: "Neighborhood Clean-Up & Tree Planting",
    story: "A grassroots project to clean up our local parks and plant 500 new native trees to green our neighborhood.",
    category: "Community",
    funding_goal: 5000,
    minimum_contribution: 5,
    deadline: new Date("2026-06-30"),
    reward_info: "Name plaque on a planted tree",
    image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
    status: "approved",
    creator_name: "Green Neighbours",
    creator_email: "green@mailinator.com",
    amount_raised: 4800
  },
  {
    title: "Mobile Mental Health Clinic",
    story: "Funding a mobile clinic to bring free counseling and mental health services directly to homeless shelters and underserved areas.",
    category: "Health",
    funding_goal: 75000,
    minimum_contribution: 20,
    deadline: new Date("2026-10-01"),
    reward_info: "Clinic sponsor logo placement, newsletter",
    image_url: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=800&q=80",
    status: "approved",
    creator_name: "Mind Matters",
    creator_email: "mindmatters@mailinator.com",
    amount_raised: 30000
  },
  {
    title: "Next-Gen Virtual Reality Headset",
    story: "Developing a lightweight, high-refresh-rate VR headset designed for immersive education and remote training applications.",
    category: "Technology",
    funding_goal: 150000,
    minimum_contribution: 100,
    deadline: new Date("2026-11-15"),
    reward_info: "Beta-tester hardware access, development kit",
    image_url: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
    status: "approved",
    creator_name: "Aether Labs",
    creator_email: "aether@mailinator.com",
    amount_raised: 95000
  },
  {
    title: "Global Climate Strike Action",
    story: "Supporting grassroots organizers planning peaceful climate demonstrations and advocacy campaigns worldwide.",
    category: "Community",
    funding_goal: 20000,
    minimum_contribution: 5,
    deadline: new Date("2026-09-05"),
    reward_info: "Digital sticker pack, organizer toolkit",
    image_url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80",
    status: "approved",
    creator_name: "Youth 4 Climate",
    creator_email: "youth4climate@mailinator.com",
    amount_raised: 18500
  },
  {
    title: "Youth Soccer Academy Sponsorship",
    story: "Providing athletic gear, training equipment, and tournament entry fees for underprivileged children in our city.",
    category: "Community",
    funding_goal: 10000,
    minimum_contribution: 10,
    deadline: new Date("2026-08-20"),
    reward_info: "Signed team jersey, photo update",
    image_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    status: "approved",
    creator_name: "Rising Stars FC",
    creator_email: "risingstars@mailinator.com",
    amount_raised: 3200
  },
  {
    title: "Eco-Friendly Biodegradable Packaging",
    story: "Scaling production of plant-based packaging materials that decompose fully within 30 days, replacing single-use plastics.",
    category: "Technology",
    funding_goal: 80000,
    minimum_contribution: 25,
    deadline: new Date("2026-10-30"),
    reward_info: "Sample pack of bio-packaging, sustainability report",
    image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80",
    status: "approved",
    creator_name: "BioWrap Solutions",
    creator_email: "biowrap@mailinator.com",
    amount_raised: 55000
  },
  {
    title: "Symphony Orchestra Concert Series",
    story: "Bringing classical music to local parks with a series of free, open-air concerts this upcoming autumn.",
    category: "Art",
    funding_goal: 12000,
    minimum_contribution: 15,
    deadline: new Date("2026-09-15"),
    reward_info: "Reserved front-row seating, conductor's baton replica",
    image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80",
    status: "approved",
    creator_name: "Metro Symphony",
    creator_email: "symphony@mailinator.com",
    amount_raised: 8400
  },
  {
    title: "Independent Comic: Shadow of the Moon",
    story: "Printing and distributing the first volume of an original sci-fi graphic novel set in a post-apocalyptic lunar colony.",
    category: "Art",
    funding_goal: 6000,
    minimum_contribution: 15,
    deadline: new Date("2026-08-15"),
    reward_info: "Signed physical copy, sketch print",
    image_url: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80",
    status: "approved",
    creator_name: "Lunar Comic Arts",
    creator_email: "lunarcomics@mailinator.com",
    amount_raised: 4800
  },
  {
    title: "Rural Health Clinic Equipment Upgrade",
    story: "Purchasing essential diagnostic tools, ECG machines, and autoclaves to improve patient care at a local rural clinic.",
    category: "Health",
    funding_goal: 40000,
    minimum_contribution: 30,
    deadline: new Date("2026-11-01"),
    reward_info: "Contributor wall plaque, annual clinic impact report",
    image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    status: "approved",
    creator_name: "Rural Health Alliance",
    creator_email: "ruralhealth@mailinator.com",
    amount_raised: 28000
  },
  {
    title: "Post-Traumatic Stress Support App",
    story: "Building a secure, private mobile app designed in collaboration with therapists to provide daily support tools for PTSD survivors.",
    category: "Health",
    funding_goal: 25000,
    minimum_contribution: 10,
    deadline: new Date("2026-09-10"),
    reward_info: "Lifetime app premium subscription, digital guidebook",
    image_url: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=800&q=80",
    status: "approved",
    creator_name: "HopeTech Mobile",
    creator_email: "hopetech@mailinator.com",
    amount_raised: 12000
  },
  {
    title: "Renewable Energy Charging Stations",
    story: "Installing 20 new public solar-powered USB charging stations in high-foot-traffic community parks.",
    category: "Technology",
    funding_goal: 35000,
    minimum_contribution: 20,
    deadline: new Date("2026-10-20"),
    reward_info: "Name printed on station solar pillar, project mug",
    image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    status: "approved",
    creator_name: "SolarPower Parks",
    creator_email: "solarparks@mailinator.com",
    amount_raised: 22000
  },
  {
    title: "Handmade Wooden Toy Workshop",
    story: "Enlarging our local woodworking workshop to produce safe, plastic-free wooden toys for children's charities.",
    category: "Art",
    funding_goal: 9000,
    minimum_contribution: 10,
    deadline: new Date("2026-07-31"),
    reward_info: "Custom engraved wooden name block, toy catalog",
    image_url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80",
    status: "approved",
    creator_name: "Heritage Woodcrafts",
    creator_email: "heritage@mailinator.com",
    amount_raised: 7500
  }
];

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB for seeding...');
    
    // Clear existing approved campaigns to prevent duplicates
    await Campaign.deleteMany({ creator_email: { $in: mockCampaigns.map(c => c.creator_email) } });
    console.log('Cleared old seed data.');

    // Insert mock campaigns
    await Campaign.insertMany(mockCampaigns);
    console.log('Successfully seeded database with approved campaigns!');
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Seeding failed:', err);
  });
