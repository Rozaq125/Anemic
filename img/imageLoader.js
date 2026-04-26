const ImageLoader = {
    loadImages: function(files) {
        return new Promise((resolve, reject) => {
            const images = [];
            let loadedCount = 0;
            
            if (files.length === 0) {
                resolve([]);
                return;
            }
            
            files.forEach((file, index) => {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = new Image();
                    
                    img.onload = function() {
                        images[index] = img;
                        loadedCount++;
                        
                        if (loadedCount === files.length) {
                            resolve(images.filter(img => img !== undefined));
                        }
                    };
                    
                    img.onerror = function() {
                        loadedCount++;
                        if (loadedCount === files.length) {
                            resolve(images.filter(img => img !== undefined));
                        }
                    };
                    
                    img.src = e.target.result;
                };
                
                reader.onerror = function() {
                    loadedCount++;
                    if (loadedCount === files.length) {
                        resolve(images.filter(img => img !== undefined));
                    }
                };
                
                reader.readAsDataURL(file);
            });
        });
    },
    
    loadImageFromBlob: function(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = function() {
                resolve(img);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            
            const url = URL.createObjectURL(blob);
            img.src = url;
        });
    }
};
