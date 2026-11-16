// House Management Module
const House = {
    currentHouse: null,
    members: [],
    unsubscribeHouse: null,
    unsubscribeMembers: null,

    // Generate random invite code
    generateInviteCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Create new house
    async createHouse(name, monthlyBudget, memberCount) {
        try {
            const inviteCode = this.generateInviteCode();

            // Check if invite code already exists
            const existing = await db.collection('houses').where('inviteCode', '==', inviteCode).get();
            if (!existing.empty) {
                // Generate new code if exists
                return this.createHouse(name, monthlyBudget, memberCount);
            }

            const houseRef = await db.collection('houses').add({
                name,
                monthlyBudget: parseFloat(monthlyBudget),
                memberCount: parseInt(memberCount),
                inviteCode,
                createdBy: Auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Add creator as admin member
            await db.collection('houses').doc(houseRef.id).collection('members').doc(Auth.currentUser.uid).set({
                displayName: Auth.userData.displayName,
                photoURL: Auth.userData.photoURL || '',
                role: 'admin',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user's houseId
            await db.collection('users').doc(Auth.currentUser.uid).update({
                houseId: houseRef.id
            });

            Auth.userData.houseId = houseRef.id;
            return { success: true, houseId: houseRef.id };
        } catch (error) {
            console.error('Error creating house:', error);
            return { success: false, error: error.message };
        }
    },

    // Join house by invite code
    async joinHouse(inviteCode) {
        try {
            const snapshot = await db.collection('houses')
                .where('inviteCode', '==', inviteCode.toUpperCase())
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Geçersiz davet kodu.' };
            }

            const houseDoc = snapshot.docs[0];
            const houseId = houseDoc.id;

            // Check if already a member
            const memberDoc = await db.collection('houses').doc(houseId)
                .collection('members').doc(Auth.currentUser.uid).get();

            if (memberDoc.exists) {
                return { success: false, error: 'Zaten bu eve üyesiniz.' };
            }

            // Add as member
            await db.collection('houses').doc(houseId).collection('members').doc(Auth.currentUser.uid).set({
                displayName: Auth.userData.displayName,
                photoURL: Auth.userData.photoURL || '',
                role: 'member',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user's houseId
            await db.collection('users').doc(Auth.currentUser.uid).update({
                houseId: houseId
            });

            Auth.userData.houseId = houseId;
            return { success: true, houseId };
        } catch (error) {
            console.error('Error joining house:', error);
            return { success: false, error: error.message };
        }
    },

    // Leave current house
    async leaveHouse() {
        try {
            if (!this.currentHouse) return { success: false, error: 'Bir eve üye değilsiniz.' };

            const houseId = Auth.userData.houseId;

            // Remove member
            await db.collection('houses').doc(houseId)
                .collection('members').doc(Auth.currentUser.uid).delete();

            // Update user
            await db.collection('users').doc(Auth.currentUser.uid).update({
                houseId: null
            });

            Auth.userData.houseId = null;
            this.currentHouse = null;
            this.members = [];
            this.unsubscribe();

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Subscribe to house data
    subscribeToHouse(houseId, callback) {
        this.unsubscribeHouse = db.collection('houses').doc(houseId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.currentHouse = { id: doc.id, ...doc.data() };
                    callback(this.currentHouse);
                }
            });
    },

    // Subscribe to members
    subscribeToMembers(houseId, callback) {
        this.unsubscribeMembers = db.collection('houses').doc(houseId)
            .collection('members')
            .onSnapshot((snapshot) => {
                this.members = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(this.members);
            });
    },

    // Unsubscribe from real-time updates
    unsubscribe() {
        if (this.unsubscribeHouse) {
            this.unsubscribeHouse();
            this.unsubscribeHouse = null;
        }
        if (this.unsubscribeMembers) {
            this.unsubscribeMembers();
            this.unsubscribeMembers = null;
        }
    },

    // Get total budget
    getTotalBudget() {
        if (!this.currentHouse) return 0;
        return this.currentHouse.monthlyBudget * this.currentHouse.memberCount;
    }
};
