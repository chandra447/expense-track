import db from './index';
import { tags, expenses, expenseTags } from './schema/expenses';

export async function loadInitialData() {
    console.log('🌱 Starting initial data load...');

    try {
        // Sample Clerk user IDs (you would replace these with actual Clerk user IDs)
        const sampleUserIds = [
            'user_sample1', // Replace with actual Clerk user IDs
            'user_sample2',
            'user_sample3',
            'user_sample4'
        ];

        console.log('🏷️ Creating tags...');
        const tagData = [
            // User 1 tags
            { tagName: 'Food & Dining', userId: sampleUserIds[0] },
            { tagName: 'Transportation', userId: sampleUserIds[0] },
            { tagName: 'Entertainment', userId: sampleUserIds[0] },
            { tagName: 'Shopping', userId: sampleUserIds[0] },
            { tagName: 'Bills & Utilities', userId: sampleUserIds[0] },
            
            // User 2 tags
            { tagName: 'Groceries', userId: sampleUserIds[1] },
            { tagName: 'Gas', userId: sampleUserIds[1] },
            { tagName: 'Movies', userId: sampleUserIds[1] },
            { tagName: 'Clothing', userId: sampleUserIds[1] },
            { tagName: 'Health & Fitness', userId: sampleUserIds[1] },
            
            // User 3 tags
            { tagName: 'Coffee', userId: sampleUserIds[2] },
            { tagName: 'Uber', userId: sampleUserIds[2] },
            { tagName: 'Books', userId: sampleUserIds[2] },
            { tagName: 'Electronics', userId: sampleUserIds[2] },
            
            // User 4 tags
            { tagName: 'Restaurants', userId: sampleUserIds[3] },
            { tagName: 'Travel', userId: sampleUserIds[3] },
            { tagName: 'Subscriptions', userId: sampleUserIds[3] },
            { tagName: 'Home & Garden', userId: sampleUserIds[3] }
        ];

        const insertedTags = await db.insert(tags).values(tagData).returning();
        console.log(`✅ Created ${insertedTags.length} tags`);

        // Create expenses
        console.log('💰 Creating expenses...');
        const expenseData = [
            // User 1 expenses
            { title: 'Lunch at Subway', amount: 1250, userId: sampleUserIds[0] },
            { title: 'Gas Station Fill-up', amount: 4500, userId: sampleUserIds[0] },
            { title: 'Movie Tickets', amount: 2800, userId: sampleUserIds[0] },
            { title: 'Grocery Shopping', amount: 8750, userId: sampleUserIds[0] },
            { title: 'Electric Bill', amount: 12500, userId: sampleUserIds[0] },
            
            // User 2 expenses
            { title: 'Weekly Groceries', amount: 6500, userId: sampleUserIds[1] },
            { title: 'Gas for Car', amount: 3200, userId: sampleUserIds[1] },
            { title: 'Netflix Subscription', amount: 1599, userId: sampleUserIds[1] },
            { title: 'New Jeans', amount: 7999, userId: sampleUserIds[1] },
            { title: 'Gym Membership', amount: 4999, userId: sampleUserIds[1] },
            
            // User 3 expenses
            { title: 'Starbucks Coffee', amount: 525, userId: sampleUserIds[2] },
            { title: 'Uber Ride', amount: 1850, userId: sampleUserIds[2] },
            { title: 'Programming Book', amount: 4999, userId: sampleUserIds[2] },
            { title: 'Wireless Mouse', amount: 2999, userId: sampleUserIds[2] },
            { title: 'Lunch Meeting', amount: 3500, userId: sampleUserIds[2] },
            
            // User 4 expenses
            { title: 'Dinner at Italian Restaurant', amount: 8500, userId: sampleUserIds[3] },
            { title: 'Flight Booking', amount: 35000, userId: sampleUserIds[3] },
            { title: 'Spotify Premium', amount: 999, userId: sampleUserIds[3] },
            { title: 'Garden Plants', amount: 4500, userId: sampleUserIds[3] },
            { title: 'Coffee Shop', amount: 650, userId: sampleUserIds[3] }
        ];

        const insertedExpenses = await db.insert(expenses).values(expenseData).returning();
        console.log(`✅ Created ${insertedExpenses.length} expenses`);

        // Create expense-tag relationships
        console.log('🔗 Creating expense-tag relationships...');
        const expenseTagData = [
            // User 1 expense tags
            { expenseId: insertedExpenses[0].id, tagId: insertedTags[0].id }, // Lunch -> Food & Dining
            { expenseId: insertedExpenses[1].id, tagId: insertedTags[1].id }, // Gas -> Transportation
            { expenseId: insertedExpenses[2].id, tagId: insertedTags[2].id }, // Movie -> Entertainment
            { expenseId: insertedExpenses[3].id, tagId: insertedTags[0].id }, // Grocery -> Food & Dining
            { expenseId: insertedExpenses[3].id, tagId: insertedTags[3].id }, // Grocery -> Shopping
            { expenseId: insertedExpenses[4].id, tagId: insertedTags[4].id }, // Electric -> Bills & Utilities
            
            // User 2 expense tags
            { expenseId: insertedExpenses[5].id, tagId: insertedTags[5].id }, // Groceries -> Groceries
            { expenseId: insertedExpenses[6].id, tagId: insertedTags[6].id }, // Gas -> Gas
            { expenseId: insertedExpenses[7].id, tagId: insertedTags[7].id }, // Netflix -> Movies
            { expenseId: insertedExpenses[8].id, tagId: insertedTags[8].id }, // Jeans -> Clothing
            { expenseId: insertedExpenses[9].id, tagId: insertedTags[9].id }, // Gym -> Health & Fitness
            
            // User 3 expense tags
            { expenseId: insertedExpenses[10].id, tagId: insertedTags[10].id }, // Coffee -> Coffee
            { expenseId: insertedExpenses[11].id, tagId: insertedTags[11].id }, // Uber -> Uber
            { expenseId: insertedExpenses[12].id, tagId: insertedTags[12].id }, // Book -> Books
            { expenseId: insertedExpenses[13].id, tagId: insertedTags[13].id }, // Mouse -> Electronics
            { expenseId: insertedExpenses[14].id, tagId: insertedTags[10].id }, // Lunch -> Coffee (coffee shop)
            
            // User 4 expense tags
            { expenseId: insertedExpenses[15].id, tagId: insertedTags[14].id }, // Dinner -> Restaurants
            { expenseId: insertedExpenses[16].id, tagId: insertedTags[15].id }, // Flight -> Travel
            { expenseId: insertedExpenses[17].id, tagId: insertedTags[16].id }, // Spotify -> Subscriptions
            { expenseId: insertedExpenses[18].id, tagId: insertedTags[17].id }, // Plants -> Home & Garden
            { expenseId: insertedExpenses[19].id, tagId: insertedTags[14].id }, // Coffee -> Restaurants
            
            // Some expenses with multiple tags
            { expenseId: insertedExpenses[2].id, tagId: insertedTags[3].id }, // Movie -> Shopping (bought snacks)
            { expenseId: insertedExpenses[16].id, tagId: insertedTags[2].id }, // Flight -> Entertainment (vacation)
        ];

        const insertedExpenseTags = await db.insert(expenseTags).values(expenseTagData).returning();
        console.log(`✅ Created ${insertedExpenseTags.length} expense-tag relationships`);

        console.log('🎉 Initial data load completed successfully!');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`🏷️ Tags: ${insertedTags.length}`);
        console.log(`💰 Expenses: ${insertedExpenses.length}`);
        console.log(`🔗 Expense-Tag Links: ${insertedExpenseTags.length}`);

        return {
            tags: insertedTags,
            expenses: insertedExpenses,
            expenseTags: insertedExpenseTags
        };

    } catch (error) {
        console.error('❌ Error loading initial data:', error);
        throw error;
    }
}

// Function to clear all data (useful for testing)
export async function clearAllData() {
    console.log('🧹 Clearing all data...');
    
    try {
        await db.delete(expenseTags);
        await db.delete(expenses);
        await db.delete(tags);
        
        console.log('✅ All data cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        throw error;
    }
}

// Run this if called directly
if (require.main === module) {
    loadInitialData()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}
