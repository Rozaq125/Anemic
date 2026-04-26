const ShelfPacker = {
    pack: function(images, maxWidth, maxHeight) {
        const sprites = images.map((img, index) => ({
            image: img,
            width: img.width,
            height: img.height,
            x: 0,
            y: 0,
            index: index
        }));
        
        sprites.sort((a, b) => Math.max(b.height, b.width) - Math.max(a.height, a.width));
        
        const shelves = [];
        let currentShelf = {
            x: 0,
            y: 0,
            width: maxWidth,
            height: 0,
            sprites: []
        };
        
        for (const sprite of sprites) {
            if (sprite.width > maxWidth || sprite.height > maxHeight) {
                continue;
            }
            
            if (currentShelf.x + sprite.width > maxWidth) {
                if (currentShelf.y + currentShelf.height + sprite.height > maxHeight) {
                    shelves.push(currentShelf);
                    currentShelf = {
                        x: 0,
                        y: shelves.reduce((sum, shelf) => sum + shelf.height, 0),
                        width: maxWidth,
                        height: sprite.height,
                        sprites: []
                    };
                } else {
                    currentShelf.x = 0;
                    currentShelf.y += currentShelf.height;
                    currentShelf.height = Math.max(currentShelf.height, sprite.height);
                }
            }
            
            sprite.x = currentShelf.x;
            sprite.y = currentShelf.y;
            
            currentShelf.sprites.push(sprite);
            currentShelf.x += sprite.width;
            currentShelf.height = Math.max(currentShelf.height, sprite.height);
        }
        
        if (currentShelf.sprites.length > 0) {
            shelves.push(currentShelf);
        }
        
        const packedSprites = [];
        shelves.forEach(shelf => {
            packedSprites.push(...shelf.sprites);
        });
        
        const actualHeight = shelves.reduce((sum, shelf) => sum + shelf.height, 0);
        
        return {
            sprites: packedSprites,
            width: maxWidth,
            height: Math.min(actualHeight, maxHeight),
            efficiency: this.calculateEfficiency(packedSprites, maxWidth, actualHeight)
        };
    },
    
    calculateEfficiency: function(sprites, totalWidth, totalHeight) {
        const usedArea = sprites.reduce((sum, sprite) => sum + (sprite.width * sprite.height), 0);
        const totalArea = totalWidth * totalHeight;
        return (usedArea / totalArea * 100).toFixed(2);
    },
    
    canFit: function(sprite, shelf, maxWidth, maxHeight) {
        return shelf.x + sprite.width <= maxWidth && 
               shelf.y + Math.max(shelf.height, sprite.height) <= maxHeight;
    }
};
