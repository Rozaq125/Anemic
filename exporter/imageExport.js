const ImageExport = {
    exportWithType: function(type, canvas, filenameBase) {
        const width = canvas.width;
        const height = canvas.height;
        const sprites = window.currentSprites || [];
        
        if (type === 'svg') {
            const svgImages = sprites
                .filter(s => s && s.image)
                .map(s => {
                    let href = s.imageData || '';
                    if (s.srcW && s.srcH && s.image) {
                        const c = document.createElement('canvas');
                        c.width = Math.max(1, Math.round(s.srcW));
                        c.height = Math.max(1, Math.round(s.srcH));
                        const cctx = c.getContext('2d');
                        cctx.clearRect(0, 0, c.width, c.height);
                        cctx.drawImage(
                            s.image,
                            Math.round(s.srcX || 0),
                            Math.round(s.srcY || 0),
                            Math.round(s.srcW),
                            Math.round(s.srcH),
                            0,
                            0,
                            c.width,
                            c.height
                        );
                        href = c.toDataURL('image/png');
                    }
                    return `<image href="${href}" x="${Math.round(s.x)}" y="${Math.round(s.y)}" width="${Math.round(s.width)}" height="${Math.round(s.height)}" />`;
                })
                .join('');
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgImages}</svg>`;
            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filenameBase}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }
        
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        exportCanvas.width = width;
        exportCanvas.height = height;
        
        if (type === 'jpg') {
            exportCtx.fillStyle = '#ffffff';
            exportCtx.fillRect(0, 0, width, height);
        } else {
            exportCtx.clearRect(0, 0, width, height);
        }
        
        sprites.forEach(sprite => {
            if (sprite && sprite.image) {
                if (sprite.srcW && sprite.srcH) {
                    exportCtx.drawImage(
                        sprite.image,
                        Math.round(sprite.srcX || 0),
                        Math.round(sprite.srcY || 0),
                        Math.round(sprite.srcW),
                        Math.round(sprite.srcH),
                        Math.round(sprite.x),
                        Math.round(sprite.y),
                        Math.round(sprite.width),
                        Math.round(sprite.height)
                    );
                } else {
                    const sw = sprite.image ? (sprite.image.naturalWidth || sprite.image.width) : Math.round(sprite.width);
                    const sh = sprite.image ? (sprite.image.naturalHeight || sprite.image.height) : Math.round(sprite.height);
                    exportCtx.drawImage(
                        sprite.image,
                        0,
                        0,
                        Math.round(sw),
                        Math.round(sh),
                        Math.round(sprite.x),
                        Math.round(sprite.y),
                        Math.round(sprite.width),
                        Math.round(sprite.height)
                    );
                }
            }
        });
        
        const mime = type === 'jpg' ? 'image/jpeg' : 'image/png';
        const ext = type === 'jpg' ? 'jpg' : 'png';
        
        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filenameBase}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, mime);
    },
    
    exportCanvas: function(canvas, filename) {
        const base = filename.replace(/\.(png|jpg|jpeg|svg)$/i, '');
        this.exportWithType('png', canvas, base);
    },
    
    exportWithGrid: function(canvas, filename) {
        const base = filename.replace(/\.(png|jpg|jpeg|svg)$/i, '');
        this.exportWithType('png', canvas, base);
    },
    
    drawGrid: function(ctx, width, height, gridSize) {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    },
    
    getCanvasDataURL: function(canvas, includeGrid = false, gridSize = 32) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        if (includeGrid) {
            this.drawGrid(tempCtx, tempCanvas.width, tempCanvas.height, gridSize);
        }
        
        const sprites = window.currentSprites || [];
        sprites.forEach(sprite => {
            if (sprite.image) {
                if (sprite.srcW && sprite.srcH) {
                    tempCtx.drawImage(
                        sprite.image,
                        Math.round(sprite.srcX || 0),
                        Math.round(sprite.srcY || 0),
                        Math.round(sprite.srcW),
                        Math.round(sprite.srcH),
                        Math.round(sprite.x),
                        Math.round(sprite.y),
                        Math.round(sprite.width),
                        Math.round(sprite.height)
                    );
                } else {
                    const sw = sprite.image ? (sprite.image.naturalWidth || sprite.image.width) : Math.round(sprite.width);
                    const sh = sprite.image ? (sprite.image.naturalHeight || sprite.image.height) : Math.round(sprite.height);
                    tempCtx.drawImage(
                        sprite.image,
                        0,
                        0,
                        Math.round(sw),
                        Math.round(sh),
                        Math.round(sprite.x),
                        Math.round(sprite.y),
                        Math.round(sprite.width),
                        Math.round(sprite.height)
                    );
                }
            }
        });
        
        return tempCanvas.toDataURL('image/png');
    }
};
