// Shopping List Module
const Shopping = {
    items: [],
    pastItems: [],
    unsubscribe: null,

    // Subscribe to shopping list
    subscribeToShoppingList(houseId, callback) {
        this.unsubscribe = db.collection('houses').doc(houseId)
            .collection('shoppingList')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                this.items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                }));
                callback(this.items);
            });
    },

    // Load past items for suggestions
    async loadPastItems(houseId) {
        try {
            const snapshot = await db.collection('houses').doc(houseId)
                .collection('pastItems')
                .orderBy('count', 'desc')
                .limit(50)
                .get();

            this.pastItems = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                count: doc.data().count
            }));
        } catch (error) {
            console.error('Error loading past items:', error);
        }
    },

    // Get suggestions based on input
    getSuggestions(input) {
        if (!input || input.length < 2) return [];

        const lowered = input.toLowerCase();
        return this.pastItems
            .filter(item => item.name.toLowerCase().includes(lowered))
            .slice(0, 5);
    },

    // Add item to shopping list
    async addItem(houseId, name) {
        try {
            const trimmedName = name.trim();
            if (!trimmedName) return { success: false, error: 'Ürün adı boş olamaz.' };

            // Check if already exists (not completed)
            const exists = this.items.find(
                item => item.name.toLowerCase() === trimmedName.toLowerCase() && !item.completed
            );
            if (exists) {
                return { success: false, error: 'Bu ürün zaten listede.' };
            }

            await db.collection('houses').doc(houseId).collection('shoppingList').add({
                name: trimmedName,
                addedBy: Auth.currentUser.uid,
                addedByName: Auth.userData.displayName,
                completed: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update past items
            await this.updatePastItem(houseId, trimmedName);

            return { success: true };
        } catch (error) {
            console.error('Error adding item:', error);
            return { success: false, error: error.message };
        }
    },

    // Update past item for suggestions
    async updatePastItem(houseId, name) {
        try {
            const pastRef = db.collection('houses').doc(houseId).collection('pastItems');
            const existing = await pastRef.where('name', '==', name).get();

            if (existing.empty) {
                await pastRef.add({
                    name,
                    count: 1
                });
            } else {
                const doc = existing.docs[0];
                await doc.ref.update({
                    count: firebase.firestore.FieldValue.increment(1)
                });
            }
        } catch (error) {
            console.error('Error updating past item:', error);
        }
    },

    // Toggle item completion
    async toggleItem(houseId, itemId, completed) {
        try {
            await db.collection('houses').doc(houseId)
                .collection('shoppingList').doc(itemId)
                .update({ completed: !completed });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Delete item
    async deleteItem(houseId, itemId) {
        try {
            await db.collection('houses').doc(houseId)
                .collection('shoppingList').doc(itemId).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Clear completed items
    async clearCompleted(houseId) {
        try {
            const completedItems = this.items.filter(item => item.completed);
            const batch = db.batch();

            completedItems.forEach(item => {
                const ref = db.collection('houses').doc(houseId)
                    .collection('shoppingList').doc(item.id);
                batch.delete(ref);
            });

            await batch.commit();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get active items
    getActiveItems() {
        return this.items.filter(item => !item.completed);
    },

    // Get completed items
    getCompletedItems() {
        return this.items.filter(item => item.completed);
    },

    // Unsubscribe
    unsubscribeFromShoppingList() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
};
