const Gizmo = {
    selectedSprites: [],
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragOffset: { x: 0, y: 0 },
    initialSpritePositions: [],
    gridSize: 32,
    isPointerLocked: false,
    isBoxSelecting: false,
    boxSelectStart: null,
    boxSelectCurrent: null,
    
    init: function(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));
    },
    
    selectSprite: function(sprite, multiSelect = false) {
        if (!multiSelect) {
            this.selectedSprites = [sprite];
            this.bringToFront([sprite]);
            return;
        }
        const idx = this.selectedSprites.indexOf(sprite);
        if (idx >= 0) {
            this.selectedSprites.splice(idx, 1);
        } else {
            this.selectedSprites.push(sprite);
        }
    },
    
    clearSelection: function() {
        this.selectedSprites = [];
    },
    
    bringToFront: function(sprites) {
        const allSprites = window.currentSprites || [];
        sprites.forEach(sprite => {
            const index = allSprites.indexOf(sprite);
            if (index > -1) {
                allSprites.splice(index, 1);
                allSprites.push(sprite);
            }
        });
    },
    
    snapToGrid: function(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    },
    
    getSelectionBounds: function() {
        if (this.selectedSprites.length === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.selectedSprites.forEach(sprite => {
            minX = Math.min(minX, sprite.x);
            minY = Math.min(minY, sprite.y);
            maxX = Math.max(maxX, sprite.x + sprite.width);
            maxY = Math.max(maxY, sprite.y + sprite.height);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    },
    
    drawGizmo: function() {
        if (this.selectedSprites.length === 0) return;
        
        const bounds = this.getSelectionBounds();
        
        this.ctx.strokeStyle = '#ff8c00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.ctx.setLineDash([]);
        
        if (this.selectedSprites.length === 1) {
            this.drawResizeHandles(bounds.x, bounds.y, bounds.width, bounds.height);
        } else {
            this.drawMultiSelectHandles(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    },

    drawBoxSelect: function() {
        if (!this.isBoxSelecting || !this.boxSelectStart || !this.boxSelectCurrent) return;
        const x1 = this.boxSelectStart.x;
        const y1 = this.boxSelectStart.y;
        const x2 = this.boxSelectCurrent.x;
        const y2 = this.boxSelectCurrent.y;
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        this.ctx.strokeStyle = '#ff8c00';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.setLineDash([]);
    },

    isSpriteInRect: function(sprite, rect) {
        const sx1 = sprite.x;
        const sy1 = sprite.y;
        const sx2 = sprite.x + sprite.width;
        const sy2 = sprite.y + sprite.height;
        const rx1 = rect.x;
        const ry1 = rect.y;
        const rx2 = rect.x + rect.width;
        const ry2 = rect.y + rect.height;
        return sx1 < rx2 && sx2 > rx1 && sy1 < ry2 && sy2 > ry1;
    },
    
    drawResizeHandles: function(x, y, width, height) {
        const handleSize = 8;
        const handles = [
            { x: x - handleSize/2, y: y - handleSize/2, cursor: 'nw-resize' },
            { x: x + width - handleSize/2, y: y - handleSize/2, cursor: 'ne-resize' },
            { x: x - handleSize/2, y: y + height - handleSize/2, cursor: 'sw-resize' },
            { x: x + width - handleSize/2, y: y + height - handleSize/2, cursor: 'se-resize' }
        ];
        
        this.ctx.fillStyle = '#ff8c00';
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        });
    },
    
    drawMultiSelectHandles: function(x, y, width, height) {
        const handleSize = 6;
        this.ctx.fillStyle = '#ff8c00';
        this.ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    },
    
    getResizeHandle: function(mouseX, mouseY) {
        if (this.selectedSprites.length === 0) return null;
        
        const bounds = this.getSelectionBounds();
        const handleSize = 8;
        const tolerance = handleSize / 2;
        
        const handles = [
            { x: bounds.x, y: bounds.y, type: 'nw' },
            { x: bounds.x + bounds.width, y: bounds.y, type: 'ne' },
            { x: bounds.x, y: bounds.y + bounds.height, type: 'sw' },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height, type: 'se' }
        ];
        
        for (const handle of handles) {
            if (Math.abs(mouseX - handle.x) <= tolerance && 
                Math.abs(mouseY - handle.y) <= tolerance) {
                return handle.type;
            }
        }
        
        return null;
    },
    
    isPointInSprite: function(mouseX, mouseY, sprite) {
        return mouseX >= sprite.x && mouseX <= sprite.x + sprite.width &&
               mouseY >= sprite.y && mouseY <= sprite.y + sprite.height;
    },

    getSpriteAtPoint: function(mouseX, mouseY) {
        const sprites = window.currentSprites || [];
        for (let i = window.currentSprites.length - 1; i >= 0; i--) {
            if (this.isPointInSprite(mouseX, mouseY, sprites[i])) {
                return sprites[i];
            }
        }
        return null;
    },
    
    onClick: function(e) {
        if (this.isPointerLocked) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const zoom = window.currentZoom || 1.0;
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;
        
        let clickedSprite = null;
        const sprites = window.currentSprites || [];
        
        for (let i = window.currentSprites.length - 1; i >= 0; i--) {
            if (this.isPointInSprite(mouseX, mouseY, sprites[i])) {
                clickedSprite = sprites[i];
                break;
            }
        }
        
        if (clickedSprite) {
            const multiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
            this.selectSprite(clickedSprite, multiSelect);
        } else {
            this.clearSelection();
        }
        
        if (window.onSpriteSelected) {
            window.onSpriteSelected(this.selectedSprites.length > 0 ? this.selectedSprites : null);
        }
    },
    
    onMouseDown: function(e) {
        if (this.isPointerLocked) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const zoom = window.currentZoom || 1.0;
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;
        
        const handle = this.getResizeHandle(mouseX, mouseY);
        if (handle && this.selectedSprites.length > 0) {
            this.isResizing = true;
            this.resizeHandle = handle;
            this.dragOffset = { x: mouseX, y: mouseY };
            this.isPointerLocked = true;
            e.preventDefault();
            return;
        }
        
        const sprites = window.currentSprites || [];
        for (let i = window.currentSprites.length - 1; i >= 0; i--) {
            if (this.isPointInSprite(mouseX, mouseY, sprites[i])) {
                if (this.selectedSprites.indexOf(sprites[i]) === -1) {
                    this.selectSprite(sprites[i], e.ctrlKey || e.metaKey || e.shiftKey);
                }
                
                this.initialSpritePositions = this.selectedSprites.map(sprite => ({
                    x: sprite.x,
                    y: sprite.y
                }));
                
                this.isDragging = true;
                this.dragOffset = { x: mouseX, y: mouseY };
                this.isPointerLocked = true;
                e.preventDefault();
                return;
            }
        }
        this.isBoxSelecting = true;
        this.boxSelectStart = { x: mouseX, y: mouseY };
        this.boxSelectCurrent = { x: mouseX, y: mouseY };
        if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
            this.clearSelection();
            if (window.onSpriteSelected) window.onSpriteSelected(null);
        }
    },
    
    onMouseMove: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const zoom = window.currentZoom || 1.0;
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;
        
        if (this.isResizing && this.selectedSprites.length > 0) {
            this.handleResize(mouseX, mouseY);
        } else if (this.isDragging && this.selectedSprites.length > 0) {
            const deltaX = mouseX - this.dragOffset.x;
            const deltaY = mouseY - this.dragOffset.y;
            
            this.selectedSprites.forEach((sprite, index) => {
                const initialPos = this.initialSpritePositions[index];
                sprite.x = this.snapToGrid(initialPos.x + deltaX);
                sprite.y = this.snapToGrid(initialPos.y + deltaY);
            });
            
            if (window.onSpriteMoved) {
                window.onSpriteMoved(this.selectedSprites);
            }
        } else if (this.isBoxSelecting && this.boxSelectStart) {
            this.boxSelectCurrent = { x: mouseX, y: mouseY };
            if (window.onSpriteSelected) window.onSpriteSelected(this.selectedSprites.length > 0 ? this.selectedSprites : null);
        } else {
            const handle = this.getResizeHandle(mouseX, mouseY);
            if (handle) {
                this.canvas.style.cursor = handle + '-resize';
            } else {
                const sprites = window.currentSprites || [];
                let cursorSet = false;
                for (let i = window.currentSprites.length - 1; i >= 0; i--) {
                    if (this.isPointInSprite(mouseX, mouseY, sprites[i])) {
                        this.canvas.style.cursor = 'move';
                        cursorSet = true;
                        break;
                    }
                }
                if (!cursorSet) {
                    this.canvas.style.cursor = 'default';
                }
            }
        }
    },
    
    onMouseUp: function() {
        const wasDragging = this.isDragging;
        const wasResizing = this.isResizing;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.isPointerLocked = false;
        this.initialSpritePositions = [];
        if (this.isBoxSelecting && this.boxSelectStart && this.boxSelectCurrent) {
            const x = Math.min(this.boxSelectStart.x, this.boxSelectCurrent.x);
            const y = Math.min(this.boxSelectStart.y, this.boxSelectCurrent.y);
            const width = Math.abs(this.boxSelectCurrent.x - this.boxSelectStart.x);
            const height = Math.abs(this.boxSelectCurrent.y - this.boxSelectStart.y);
            const rect = { x, y, width, height };
            const sprites = window.currentSprites || [];
            const hits = sprites.filter(s => this.isSpriteInRect(s, rect));
            hits.forEach(s => {
                if (this.selectedSprites.indexOf(s) === -1) this.selectedSprites.push(s);
            });
            if (window.onSpriteSelected) window.onSpriteSelected(this.selectedSprites.length > 0 ? this.selectedSprites : null);
        }
        this.isBoxSelecting = false;
        this.boxSelectStart = null;
        this.boxSelectCurrent = null;
        if ((wasDragging || wasResizing) && window.onSpritesCommitted) {
            window.onSpritesCommitted();
        }
    },
    
    handleResize: function(mouseX, mouseY) {
        if (this.selectedSprites.length === 0) return;
        
        const bounds = this.getSelectionBounds();
        const originalBounds = { ...bounds };
        
        switch (this.resizeHandle) {
            case 'nw':
                bounds.x = this.snapToGrid(mouseX);
                bounds.y = this.snapToGrid(mouseY);
                bounds.width = originalBounds.x + originalBounds.width - bounds.x;
                bounds.height = originalBounds.y + originalBounds.height - bounds.y;
                break;
            case 'ne':
                bounds.y = this.snapToGrid(mouseY);
                bounds.width = this.snapToGrid(mouseX - originalBounds.x);
                bounds.height = originalBounds.y + originalBounds.height - bounds.y;
                break;
            case 'sw':
                bounds.x = this.snapToGrid(mouseX);
                bounds.width = originalBounds.x + originalBounds.width - bounds.x;
                bounds.height = this.snapToGrid(mouseY - originalBounds.y);
                break;
            case 'se':
                bounds.width = this.snapToGrid(mouseX - originalBounds.x);
                bounds.height = this.snapToGrid(mouseY - originalBounds.y);
                break;
        }
        
        bounds.width = Math.max(this.gridSize, bounds.width);
        bounds.height = Math.max(this.gridSize, bounds.height);
        
        const scaleX = bounds.width / originalBounds.width;
        const scaleY = bounds.height / originalBounds.height;
        const deltaX = bounds.x - originalBounds.x;
        const deltaY = bounds.y - originalBounds.y;
        
        this.selectedSprites.forEach(sprite => {
            const relativeX = sprite.x - originalBounds.x;
            const relativeY = sprite.y - originalBounds.y;
            
            sprite.x = bounds.x + relativeX * scaleX;
            sprite.y = bounds.y + relativeY * scaleY;
            sprite.width = sprite.width * scaleX;
            sprite.height = sprite.height * scaleY;
            
            sprite.x = this.snapToGrid(sprite.x);
            sprite.y = this.snapToGrid(sprite.y);
            sprite.width = Math.max(this.gridSize, Math.round(sprite.width / this.gridSize) * this.gridSize);
            sprite.height = Math.max(this.gridSize, Math.round(sprite.height / this.gridSize) * this.gridSize);
        });
        
        if (window.onSpriteResized) {
            window.onSpriteResized(this.selectedSprites);
        }
    },
    
    deleteSelected: function() {
        if (this.selectedSprites.length === 0) return;
        
        const sprites = window.currentSprites || [];
        this.selectedSprites.forEach(sprite => {
            const index = sprites.indexOf(sprite);
            if (index > -1) {
                sprites.splice(index, 1);
            }
        });
        
        this.clearSelection();
        if (window.onSpriteSelected) {
            window.onSpriteSelected(null);
        }
        
        if (window.onSpritesDeleted) {
            window.onSpritesDeleted();
        }
    },
    
    setGridSize: function(size) {
        this.gridSize = size;
    }
};
