require('dotenv').config();
const mongoose = require('mongoose');
const Glossary = require('./src/models/Glossary');

const glossaryTerms = [
  {
    en: 'Yes',
    bm: 'Yes',
    zh: 'Yes',
    category: 'brand',
    doNotTranslate: true,
    notes: 'Brand name - never translate',
    version: 'v1.0',
    isActive: true
  },
  {
    en: '5G',
    bm: '5G',
    zh: '5G',
    category: 'technical',
    doNotTranslate: true,
    notes: 'Technical term - keep as-is',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Unlimited',
    bm: 'Tanpa Had',
    zh: '无限',
    category: 'product',
    doNotTranslate: false,
    notes: 'Standard product feature term',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Data',
    bm: 'Data',
    zh: '数据',
    category: 'technical',
    doNotTranslate: false,
    notes: '',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Premium',
    bm: 'Premium',
    zh: '高级',
    category: 'product',
    doNotTranslate: false,
    notes: 'BM keeps English, ZH translates',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Plan',
    bm: 'Pelan',
    zh: '套餐',
    category: 'product',
    doNotTranslate: false,
    notes: '',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Sign Up',
    bm: 'Daftar',
    zh: '注册',
    category: 'general',
    doNotTranslate: false,
    notes: 'Common CTA term',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Get',
    bm: 'Dapatkan',
    zh: '获取',
    category: 'general',
    doNotTranslate: false,
    notes: '',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Now',
    bm: 'Sekarang',
    zh: '现在',
    category: 'general',
    doNotTranslate: false,
    notes: '',
    version: 'v1.0',
    isActive: true
  },
  {
    en: 'Free',
    bm: 'Percuma',
    zh: '免费',
    category: 'product',
    doNotTranslate: false,
    notes: '',
    version: 'v1.0',
    isActive: true
  }
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing glossary...');
    await Glossary.deleteMany({});
    console.log('✅ Cleared');

    console.log('📝 Adding sample glossary terms...');
    await Glossary.insertMany(glossaryTerms);
    console.log(`✅ Added ${glossaryTerms.length} glossary terms`);

    console.log('\n📊 Glossary Summary:');
    const categories = await Glossary.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    categories.forEach(cat => {
      console.log(`   - ${cat._id}: ${cat.count} terms`);
    });

    console.log('\n🎉 Database seeding complete!');
    console.log('\nYou can now:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Access the glossary at http://localhost:5173/glossary');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
