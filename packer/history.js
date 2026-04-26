const History = {
    states: [],
    currentIndex: -1,
    maxStates: 50,

    pushState: function(sprites) {
        const deepCopy = JSON.parse(JSON.stringify(sprites));
        const snapshot = JSON.stringify(deepCopy.map((sprite, i) => ({
            id: sprite.id,
            name: sprite.name,
            x: sprite.x,
            y: sprite.y,
            width: sprite.width,
            height: sprite.height,
            srcX: sprite.srcX != null ? sprite.srcX : 0,
            srcY: sprite.srcY != null ? sprite.srcY : 0,
            srcW: sprite.srcW,
            srcH: sprite.srcH,
            zIndex: sprite.zIndex != null ? sprite.zIndex : i,
            imageData: sprite.imageData || null
        })));

        if (this.currentIndex < this.states.length - 1) {
            this.states = this.states.slice(0, this.currentIndex + 1);
        }

        this.states.push(snapshot);
        this.currentIndex++;

        if (this.states.length > this.maxStates) {
            this.states.shift();
            this.currentIndex--;
        }
    },

    undo: function() {
        if (this.canUndo()) {
            this.currentIndex--;
            return this.getCurrentState();
        }
        return null;
    },

    redo: function() {
        if (this.canRedo()) {
            this.currentIndex++;
            return this.getCurrentState();
        }
        return null;
    },

    canUndo: function() {
        return this.currentIndex > 0;
    },

    canRedo: function() {
        return this.currentIndex < this.states.length - 1;
    },

    getCurrentState: function() {
        if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
            const parsed = JSON.parse(this.states[this.currentIndex]);
            if (!window.imageAssets) window.imageAssets = new Map();
            return parsed.map(spriteData => {
                const sprite = { ...spriteData, image: null };
                if (sprite.imageData && window.imageAssets.has(sprite.imageData)) {
                    sprite.image = window.imageAssets.get(sprite.imageData);
                } else if (sprite.imageData) {
                    const img = new Image();
                    img.onload = () => {
                        window.imageAssets.set(sprite.imageData, img);
                        sprite.image = img;
                        if (window.renderCallback) window.renderCallback();
                    };
                    img.src = sprite.imageData;
                    window.imageAssets.set(sprite.imageData, img);
                    sprite.image = img;
                }
                return sprite;
            });
        }
        return null;
    },

    clear: function() {
        this.states = [];
        this.currentIndex = -1;
    }
};
