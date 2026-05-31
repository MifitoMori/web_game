export const DEFAULT_SKIN_SLUG = 'hitman-skin';

export const SKIN_ASSETS = {
    'hitman-skin': {
        textureKey: 'skin-hitman',
        imagePath: 'assets/PNG/Hitman 1/hitman1_hold.png'
    },
    'soldier-skin': {
        textureKey: 'skin-soldier',
        imagePath: 'assets/PNG/Soldier 1/soldier1_hold.png'
    },
    'robot-skin': {
        textureKey: 'skin-robot',
        imagePath: 'assets/PNG/Robot 1/robot1_hold.png'
    },
    'survivor-skin': {
        textureKey: 'skin-survivor',
        imagePath: 'assets/PNG/Survivor 1/survivor1_hold.png'
    },
    'man-blue-skin': {
        textureKey: 'skin-man-blue',
        imagePath: 'assets/PNG/Man Blue/manBlue_hold.png'
    },
    'man-brown-skin': {
        textureKey: 'skin-man-brown',
        imagePath: 'assets/PNG/Man Brown/manBrown_hold.png'
    },
    'man-old-skin': {
        textureKey: 'skin-man-old',
        imagePath: 'assets/PNG/Man Old/manOld_hold.png'
    },
    'woman-green-skin': {
        textureKey: 'skin-woman-green',
        imagePath: 'assets/PNG/Woman Green/womanGreen_hold.png'
    },
    'zombie-skin': {
        textureKey: 'skin-zombie',
        imagePath: 'assets/PNG/Zombie 1/zoimbie1_hold.png'
    }
};

export const getSkinConfig = (skinSlug) => (
    SKIN_ASSETS[skinSlug] || SKIN_ASSETS[DEFAULT_SKIN_SLUG]
);

export const getSkinTextureKey = (skinSlug) => getSkinConfig(skinSlug).textureKey;

export const preloadSkinAssets = (loader) => {
    Object.values(SKIN_ASSETS).forEach((skin) => {
        loader.image(skin.textureKey, skin.imagePath);
    });
};
