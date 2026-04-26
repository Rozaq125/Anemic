const HeaderGen = {
    generate: function(sprites) {
        let header = '#ifndef SPRITES_H\n';
        header += '#define SPRITES_H\n\n';
        header += '#include <cstdint>\n\n';
        header += 'struct SpriteRect {\n';
        header += '    uint16_t x;\n';
        header += '    uint16_t y;\n';
        header += '    uint16_t width;\n';
        header += '    uint16_t height;\n';
        header += '};\n\n';
        
        header += 'enum class SpriteID {\n';
        sprites.forEach((sprite, index) => {
            const name = `SPRITE_${index}`;
            header += `    ${name}${index < sprites.length - 1 ? ',' : ''}\n`;
        });
        header += '};\n\n';
        
        header += 'constexpr SpriteRect SPRITE_DATA[] = {\n';
        sprites.forEach((sprite, index) => {
            const name = `SPRITE_${index}`;
            header += `    { ${sprite.x}, ${sprite.y}, ${sprite.width}, ${sprite.height} }`;
            header += index < sprites.length - 1 ? ',\n' : '\n';
        });
        header += '};\n\n';
        
        header += 'constexpr uint16_t SPRITE_SHEET_WIDTH = 1024;\n';
        header += 'constexpr uint16_t SPRITE_SHEET_HEIGHT = 1024;\n\n';
        
        header += 'inline const SpriteRect& getSpriteRect(SpriteID id) {\n';
        header += '    return SPRITE_DATA[static_cast<size_t>(id)];\n';
        header += '}\n\n';
        
        header += '#endif // SPRITES_H\n';
        
        return header;
    },
    
    download: function(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    },
    
    generateStruct: function(sprites) {
        let header = '#ifndef SPRITES_H\n';
        header += '#define SPRITES_H\n\n';
        header += '#include <cstdint>\n\n';
        header += 'struct Sprite {\n';
        header += '    uint16_t x;\n';
        header += '    uint16_t y;\n';
        header += '    uint16_t width;\n';
        header += '    uint16_t height;\n';
        header += '};\n\n';
        
        header += 'namespace Sprites {\n';
        sprites.forEach((sprite, index) => {
            const name = `Sprite${index}`;
            header += `    constexpr Sprite ${name} = { ${sprite.x}, ${sprite.y}, ${sprite.width}, ${sprite.height} };\n`;
        });
        header += '}\n\n';
        
        header += '#endif // SPRITES_H\n';
        
        return header;
    }
};
