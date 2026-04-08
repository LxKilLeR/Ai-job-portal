const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('./models/Job');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file!');
  process.exit(1);
}

const sampleJobs = [
  {
    title: 'Senior Frontend Developer',
    company: 'TechNova',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $150k',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
    remote: true,
    description: 'We are looking for an experienced Senior Frontend Developer to lead our UI team. You will architect and build high-performance, scalable web applications using React 19 and TypeScript. You\'ll collaborate with product designers and backend engineers to deliver world-class digital experiences.\n\nThis is a unique opportunity to join a fast-growing AI startup at the forefront of the industry. You\'ll shape the technical direction, mentor junior engineers, and directly impact millions of users.',
    requirements: [
      '5+ years of frontend development experience',
      'Strong proficiency in React and TypeScript',
      'Experience with Tailwind CSS and modern design systems',
      'Deep knowledge of web performance optimization',
      'Familiarity with REST APIs and GraphQL',
      'Experience with CI/CD pipelines and Git workflows'
    ]
  },
  {
    title: 'AI Engineer',
    company: 'DeepCognition',
    location: 'Remote',
    type: 'Full-time',
    salary: '$140k - $180k',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'Machine Learning'],
    remote: true,
    description: 'Join our world-class AI research team to design, train, and deploy cutting-edge machine learning models. You will work on large-scale distributed training systems and take models from research to production.\n\nAt DeepCognition, we are building the next generation of AI-powered career tools. You will have the opportunity to work on LLM fine-tuning, RAG pipelines, and real-time inference optimization alongside some of the brightest minds in the industry.',
    requirements: [
      '3+ years of Python ML development',
      'Hands-on experience with PyTorch or TensorFlow',
      'Strong fundamentals in mathematics and statistics',
      'Experience deploying models to production (FastAPI, Docker)',
      'Familiarity with LLM fine-tuning and prompt engineering',
      'Bonus: Experience with LangChain, vector databases (Pinecone, Weaviate)'
    ]
  },
  {
    title: 'Full Stack Developer',
    company: 'BuildFast',
    location: 'New York, NY',
    type: 'Hybrid',
    salary: '$110k - $140k',
    skills: ['React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL'],
    remote: false,
    description: 'We need a highly skilled Full Stack Developer to build and maintain our customer-facing SaaS platform. You will own features end-to-end, from database schema design to pixel-perfect UI implementation.\n\nBuildFast is a Series B startup revolutionizing how small businesses manage operations. You\'ll work in a fast-paced, collaborative environment with a team that ships weekly and iterates quickly based on user feedback.',
    requirements: [
      '3+ years of full-stack development experience',
      'Proficiency in React and Node.js/Express',
      'Strong SQL and NoSQL database skills',
      'RESTful API design and development',
      'Experience with cloud platforms (AWS, GCP, or Azure)',
      'Strong problem-solving and communication skills'
    ]
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudScale',
    location: 'Remote',
    type: 'Full-time',
    salary: '$130k - $160k',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'],
    remote: true,
    description: 'Help us scale our infrastructure to handle billions of requests per day and automate deployment pipelines for 3 global engineering teams. You will design, implement, and maintain cloud infrastructure using infrastructure-as-code best practices.\n\nCloudScale serves Fortune 500 clients with zero-downtime guarantee. You\'ll be a critical part of making that promise a reality.',
    requirements: [
      '4+ years of DevOps/SRE experience',
      'Expert-level Kubernetes and Docker knowledge',
      'AWS certification (Solutions Architect or DevOps Engineer preferred)',
      'Proficiency with Terraform and Ansible',
      'Strong scripting skills (Bash, Python)',
      'Experience with monitoring tools (Prometheus, Grafana, Datadog)'
    ]
  },
  {
    title: 'Product Manager',
    company: 'Innovate Tech',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$100k - $130k',
    skills: ['Agile', 'Scrum', 'Product Strategy', 'User Research', 'Analytics'],
    remote: false,
    description: 'Lead product development from zero-to-one. You will define the product vision, create detailed specifications, and work alongside engineering and design to ship features that delight our 500k+ users.\n\nInnovate Tech is an AI-first productivity platform growing 40% month-over-month. You will be empowered to make high-impact decisions and own the entire product lifecycle.',
    requirements: [
      '3+ years of product management experience at a tech company',
      'Strong data-driven decision-making skills (SQL, Mixpanel, Amplitude)',
      'Experience running A/B tests and user interviews',
      'Excellent written and verbal communication',
      'Ability to write clear PRDs and user stories',
      'Technical background or experience working closely with engineers'
    ]
  },
  {
    title: 'UI/UX Designer',
    company: 'GlassUI',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $120k',
    skills: ['Figma', 'Framer', 'UI Design', 'UX Research', 'Prototyping'],
    remote: true,
    description: 'Create stunning, user-centered design experiences for our flagship SaaS product. You will own the design system, run user research sessions, and collaborate closely with engineers to bring your designs to life with pixel-perfect precision.\n\nGlassUI is a design-led company. Our product is loved by 200k+ designers worldwide and you will directly shape its visual identity and user experience.',
    requirements: [
      '4+ years of UI/UX design experience for digital products',
      'Expert-level Figma skills including components and auto-layout',
      'Experience building and maintaining design systems',
      'Strong portfolio showcasing mobile and web design work',
      'Ability to conduct usability testing and synthesize findings',
      'Bonus: Framer or Webflow prototyping experience'
    ]
  },
  {
    title: 'Backend Engineer',
    company: 'DataStream',
    location: 'Seattle, WA',
    type: 'Full-time',
    salary: '$125k - $165k',
    skills: ['Go', 'Python', 'PostgreSQL', 'Redis', 'Microservices'],
    remote: false,
    description: 'Build the data infrastructure that powers real-time analytics for thousands of enterprise clients. You will design high-throughput APIs, optimize database queries, and architect event-driven microservices capable of processing millions of events per second.\n\nDataStream is trusted by major financial institutions and healthcare organizations. You will work on technically challenging problems at massive scale with a senior, impact-driven team.',
    requirements: [
      '4+ years of backend engineering experience',
      'Proficiency in Go or Python for high-performance services',
      'Deep SQL knowledge and PostgreSQL tuning experience',
      'Experience with Redis, Kafka, or similar distributed systems',
      'Strong understanding of microservices and API design patterns',
      'Experience with high-availability, low-latency system design'
    ]
  },
  {
    title: 'Machine Learning Intern',
    company: 'NeuralBox',
    location: 'San Francisco, CA',
    type: 'Internship',
    salary: '$45/hr',
    skills: ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'Jupyter'],
    remote: false,
    description: 'Get hands-on experience working on real ML projects used in production. You will be mentored by senior researchers and contribute to model training, data pipelines, and experiment tracking.\n\nNeuralBox offers one of the best internship programs in the industry. Past interns have received full-time offers and gone on to publish research at top ML conferences.',
    requirements: [
      'Currently pursuing a degree in CS, Data Science, or related field',
      'Solid Python programming skills',
      'Foundational ML knowledge (linear algebra, probability, basic algorithms)',
      'Experience with pandas, NumPy, and Jupyter notebooks',
      'Eagerness to learn and collaborate in a fast-paced environment'
    ]
  }
];

const sampleUser = {
  name: 'Demo User',
  email: 'demo@hireai.io',
  password: 'demo123456',
  role: 'Seeker'
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing jobs
    const deleted = await Job.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} old jobs`);

    // Upsert demo user (don't delete other users)
    await User.findOneAndUpdate(
      { email: sampleUser.email },
      sampleUser,
      { upsert: true, new: true }
    );
    console.log('✅ Demo user ready: demo@hireai.io / demo123456');

    // Create sample jobs
    const jobs = await Job.insertMany(sampleJobs);
    console.log(`\n✅ Created ${jobs.length} jobs:`);
    jobs.forEach((job, i) => {
      console.log(`  ${i + 1}. [${job._id}] ${job.title} @ ${job.company}`);
    });

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Login:');
    console.log('   Email:    demo@hireai.io');
    console.log('   Password: demo123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
