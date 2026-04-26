// Test script to check vendor API with proper authentication headers

async function testVendorAPI() {
    const testUserIds = [
        'firebase-vendor-user-123',
        'vendor@speedcopy.com', 
        'test-vendor-123',
        'vendor-user-001',
        'speedcopy-vendor-1'
    ];

    console.log('🔍 Testing vendor API with proper authentication headers...\n');

    for (const userId of testUserIds) {
        console.log(`Testing user: ${userId}`);
        
        try {
            const response = await fetch('http://localhost:4010/api/vendor/stores', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'x-user-role': 'vendor', // Adding the required role header
                },
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Success: Found ${result.data.length} stores`);
                if (result.data.length > 0) {
                    result.data.forEach(store => {
                        console.log(`   - ${store.name} (${store.address.pincode})`);
                    });
                }
            } else {
                const error = await response.json();
                console.log(`❌ Error: ${error.message}`);
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }

    // Test through gateway as well
    console.log('🌐 Testing through gateway (port 4000)...\n');
    
    for (const userId of testUserIds) {
        console.log(`Testing user through gateway: ${userId}`);
        
        try {
            const response = await fetch('http://localhost:4000/api/vendor/stores', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'x-user-role': 'vendor',
                },
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Gateway Success: Found ${result.data.length} stores`);
                if (result.data.length > 0) {
                    result.data.forEach(store => {
                        console.log(`   - ${store.name} (${store.address.pincode})`);
                    });
                }
            } else {
                const error = await response.json();
                console.log(`❌ Gateway Error: ${error.message}`);
            }
        } catch (error) {
            console.log(`❌ Gateway Request failed: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
}

testVendorAPI().catch(console.error);