// Expenses Module
const Expenses = {
    expenses: [],
    unsubscribe: null,

    // Subscribe to expenses
    subscribeToExpenses(houseId, callback) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        this.unsubscribe = db.collection('houses').doc(houseId)
            .collection('expenses')
            .orderBy('date', 'desc')
            .onSnapshot((snapshot) => {
                this.expenses = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date?.toDate() || new Date()
                }));
                callback(this.expenses);
            });
    },

    // Get current month expenses
    getCurrentMonthExpenses() {
        // Return all current expenses since manual monthly reset is active
        return this.expenses;
    },

    // Get expenses by month
    getExpensesByMonth(year, month) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59);
        return this.expenses.filter(exp => exp.date >= start && exp.date <= end);
    },

    // Add new expense
    async addExpense(houseId, description, amount, date, receiptFile) {
        try {
            let receiptURL = '';

            // Upload receipt to Cloudinary if provided
            if (receiptFile) {
                const uploadResult = await Cloudinary.uploadReceipt(receiptFile);
                if (uploadResult.success) {
                    receiptURL = uploadResult.url;
                }
            }

            await db.collection('houses').doc(houseId).collection('expenses').add({
                description,
                amount: parseFloat(amount),
                date: firebase.firestore.Timestamp.fromDate(new Date(date)),
                receiptURL,
                addedBy: Auth.currentUser.uid,
                addedByName: Auth.userData.displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error adding expense:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete expense
    async deleteExpense(houseId, expenseId) {
        try {
            await db.collection('houses').doc(houseId)
                .collection('expenses').doc(expenseId).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get total for current month
    getCurrentMonthTotal() {
        return this.getCurrentMonthExpenses().reduce((sum, exp) => sum + exp.amount, 0);
    },

    // Get spending by member for current month
    getSpendingByMember() {
        const currentExpenses = this.getCurrentMonthExpenses();
        const spending = {};

        currentExpenses.forEach(exp => {
            if (!spending[exp.addedBy]) {
                spending[exp.addedBy] = {
                    userId: exp.addedBy,
                    name: exp.addedByName,
                    total: 0
                };
            }
            spending[exp.addedBy].total += exp.amount;
        });

        return Object.values(spending).sort((a, b) => b.total - a.total);
    },

    // Stop listening
    unsubscribeFromExpenses() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    },

    // Format date
    formatDate(date) {
        const options = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('tr-TR', options);
    },

    // Get available months for filter
    getAvailableMonths() {
        const months = new Set();
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        this.expenses.forEach(exp => {
            const date = exp.date instanceof Date ? exp.date : exp.date.toDate();
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            months.add(key);
        });

        // Add current month if not exists
        const now = new Date();
        months.add(`${now.getFullYear()}-${now.getMonth()}`);

        return Array.from(months).map(key => {
            const [year, month] = key.split('-').map(Number);
            return {
                key,
                year,
                month,
                label: `${monthNames[month]} ${year}`
            };
        }).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }
};
