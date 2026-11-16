// Authentication Module
const Auth = {
    currentUser: null,
    userData: null,

    // Initialize auth state listener
    init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData();
                App.handleAuthStateChange(true);
            } else {
                this.currentUser = null;
                this.userData = null;
                App.handleAuthStateChange(false);
            }
        });
    },

    // Load user data from Firestore
    async loadUserData() {
        if (!this.currentUser) return null;

        const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
        if (userDoc.exists) {
            this.userData = { id: userDoc.id, ...userDoc.data() };
        } else {
            // Create user document if doesn't exist
            const newUserData = {
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                photoURL: this.currentUser.photoURL || '',
                houseId: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(this.currentUser.uid).set(newUserData);
            this.userData = { id: this.currentUser.uid, ...newUserData };
        }
        return this.userData;
    },

    // Register new user
    async register(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName });

            // Create user document
            await db.collection('users').doc(userCredential.user.uid).set({
                email,
                displayName,
                photoURL: '',
                houseId: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Login user
    async login(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Logout
    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Reset password
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Update profile
    async updateProfile(displayName, photoURL) {
        try {
            const updates = {};
            if (displayName) updates.displayName = displayName;
            if (photoURL !== undefined) updates.photoURL = photoURL;

            await db.collection('users').doc(this.currentUser.uid).update(updates);

            if (displayName) {
                await this.currentUser.updateProfile({ displayName });
            }

            await this.loadUserData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Upload profile photo using Cloudinary
    async uploadProfilePhoto(file) {
        try {
            const result = await Cloudinary.uploadProfilePhoto(file);
            if (!result.success) {
                return { success: false, error: result.error };
            }
            await this.updateProfile(null, result.url);
            return { success: true, photoURL: result.url };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get Turkish error messages
    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'Bu email adresi zaten kullanımda.',
            'auth/invalid-email': 'Geçersiz email adresi.',
            'auth/operation-not-allowed': 'Bu işlem şu anda kullanılamıyor.',
            'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalı.',
            'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
            'auth/user-not-found': 'Bu email ile kayıtlı kullanıcı bulunamadı.',
            'auth/wrong-password': 'Yanlış şifre.',
            'auth/invalid-credential': 'Geçersiz email veya şifre.',
            'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.'
        };
        return messages[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
    },

    // Get default avatar
    getDefaultAvatar() {
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzMzQxNTUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxOCIgZmlsbD0iIzY0NzQ4YiIvPjxwYXRoIGQ9Ik0yMCA4NWMwLTIwIDEzLTMwIDMwLTMwczMwIDEwIDMwIDMwIiBmaWxsPSIjNjQ3NDhiIi8+PC9zdmc+';
    }
};
