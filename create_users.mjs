import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);

async function main() {
    console.log('🚀 Creating test users (Without Roles)...');

    const USERS = [
        {
            email: 'test-manager@test.com',
            emailVisibility: true,
            password: 'password123',
            passwordConfirm: 'password123',
            name: 'Test Manager'
        },
        {
            email: 'test-editor@test.com',
            emailVisibility: true,
            password: 'password123',
            passwordConfirm: 'password123',
            name: 'Test Editor'
        }
    ];

    for (const u of USERS) {
        try {
            // Check if exists
            try {
                const existing = await pb.collection('users').getFirstListItem(`email="${u.email}"`);
                if (existing) {
                    console.log(`ℹ️ User ${u.email} already exists. ID: ${existing.id}`);
                    continue;
                }
            } catch (err) {
                if (err.status !== 404) throw err;
            }

            const record = await pb.collection('users').create(u);
            console.log(`✅ Created ${u.email}`);
        } catch (err) {
            console.error(`❌ Failed to create ${u.email}:`, err.message);
        }
    }
}

main();
