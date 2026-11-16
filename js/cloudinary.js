// Cloudinary Image Upload Module
const Cloudinary = {
    cloudName: 'dj0vyix8c',
    uploadPreset: 'iasapp',

    // Upload image to Cloudinary
    async uploadImage(file, folder = 'general') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.uploadPreset);
            formData.append('folder', `iasapp/${folder}`);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return {
                success: true,
                url: data.secure_url,
                publicId: data.public_id
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            return {
                success: false,
                error: 'Fotoğraf yüklenirken hata oluştu'
            };
        }
    },

    // Upload profile photo
    async uploadProfilePhoto(file) {
        return this.uploadImage(file, 'profiles');
    },

    // Upload receipt photo
    async uploadReceipt(file) {
        return this.uploadImage(file, 'receipts');
    },

    // Get optimized thumbnail URL
    getThumbnailUrl(url, width = 150) {
        if (!url || !url.includes('cloudinary')) return url;
        return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto/`);
    }
};
