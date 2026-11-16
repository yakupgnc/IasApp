// Calculation Module
const Calculate = {
    // Calculate who owes whom
    calculateDebts(members, expenses) {
        if (!members.length || !expenses.length) {
            return { total: 0, perPerson: 0, breakdown: [], transfers: [] };
        }

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const perPerson = total / members.length;

        // Calculate each member's spending
        const memberSpending = {};
        members.forEach(member => {
            memberSpending[member.id] = {
                id: member.id,
                name: member.displayName,
                photoURL: member.photoURL,
                spent: 0,
                diff: 0
            };
        });

        expenses.forEach(exp => {
            if (memberSpending[exp.addedBy]) {
                memberSpending[exp.addedBy].spent += exp.amount;
            }
        });

        // Calculate difference (positive = creditor, negative = debtor)
        Object.values(memberSpending).forEach(member => {
            member.diff = member.spent - perPerson;
        });

        const breakdown = Object.values(memberSpending).sort((a, b) => b.spent - a.spent);

        // Calculate transfers
        const transfers = this.calculateTransfers(breakdown);

        return {
            total: Math.round(total * 100) / 100,
            perPerson: Math.round(perPerson * 100) / 100,
            breakdown,
            transfers
        };
    },

    // Calculate optimal transfers
    calculateTransfers(breakdown) {
        const transfers = [];

        // Separate creditors and debtors
        const creditors = breakdown.filter(m => m.diff > 0.01).map(m => ({
            ...m,
            remaining: m.diff
        }));
        const debtors = breakdown.filter(m => m.diff < -0.01).map(m => ({
            ...m,
            remaining: Math.abs(m.diff)
        }));

        // Sort by amount
        creditors.sort((a, b) => b.remaining - a.remaining);
        debtors.sort((a, b) => b.remaining - a.remaining);

        // Match debtors to creditors
        for (const debtor of debtors) {
            for (const creditor of creditors) {
                if (debtor.remaining < 0.01 || creditor.remaining < 0.01) continue;

                const amount = Math.min(debtor.remaining, creditor.remaining);

                if (amount >= 0.01) {
                    transfers.push({
                        from: debtor.name,
                        fromId: debtor.id,
                        to: creditor.name,
                        toId: creditor.id,
                        amount: Math.round(amount * 100) / 100
                    });

                    debtor.remaining -= amount;
                    creditor.remaining -= amount;
                }
            }
        }

        return transfers;
    },

    // Archive current month and reset
    async archiveAndReset(houseId, total, breakdown, transfers) {
        try {
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Save archive
            await db.collection('houses').doc(houseId).collection('archives').add({
                month: monthKey,
                total,
                breakdown,
                transfers,
                archivedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Delete all current month expenses
            const expenses = Expenses.getCurrentMonthExpenses();
            const batch = db.batch();

            expenses.forEach(exp => {
                const ref = db.collection('houses').doc(houseId)
                    .collection('expenses').doc(exp.id);
                batch.delete(ref);
            });

            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error('Error archiving:', error);
            return { success: false, error: error.message };
        }
    },

    // Format currency
    formatCurrency(amount) {
        return `${amount.toFixed(2)}€`;
    },

    // Fetch archive logs from database
    async getArchives(houseId) {
        try {
            const snapshot = await db.collection('houses').doc(houseId)
                .collection('archives')
                .orderBy('month', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching archives:', error);
            return [];
        }
    }
};
