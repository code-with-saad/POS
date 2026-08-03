import { useState } from 'react';

/**
 * Returns a relevant emoji/icon based on item name and category name
 */
function getFallbackMaterialIcon(itemName = '', categoryName = '') {
  const name = itemName ? String(itemName).toLowerCase() : '';
  const cat = categoryName ? String(categoryName).toLowerCase() : '';

  if (name.includes('espresso') || name.includes('cappuccino') || name.includes('latte') || name.includes('coffee') || name.includes('chai')) return 'local_cafe';
  if (name.includes('tea')) return 'emoji_food_beverage';
  if (name.includes('mojito') || name.includes('slush') || name.includes('margarita')) return 'local_bar';
  if (name.includes('iced') || name.includes('cold') || name.includes('shake') || name.includes('smoothie') || name.includes('drink')) return 'local_drink';
  if (name.includes('burger') || name.includes('zinger') || name.includes('sandwich')) return 'fastfood';
  if (name.includes('pizza')) return 'local_pizza';
  if (name.includes('fries') || name.includes('snack')) return 'bakery_dining';
  if (name.includes('cake') || name.includes('brownie') || name.includes('dessert')) return 'cake';
  if (name.includes('ice cream') || name.includes('gelato')) return 'icecream';
  if (name.includes('pasta') || name.includes('ramen') || name.includes('noodle')) return 'ramen_dining';
  if (name.includes('chicken') || name.includes('meat') || name.includes('dinner')) return 'dinner_dining';

  if (cat.includes('beverage') || cat.includes('drink')) return 'local_cafe';
  if (cat.includes('food') || cat.includes('main')) return 'restaurant';
  if (cat.includes('dessert') || cat.includes('sweet')) return 'cake';

  return 'restaurant_menu';
}

export default function ItemVisual({ imageUrl, itemName, categoryName, className = 'item-visual-box' }) {
  const [imgError, setImgError] = useState(false);
  const [prevUrl, setPrevUrl] = useState(imageUrl);

  if (imageUrl !== prevUrl) {
    setPrevUrl(imageUrl);
    setImgError(false);
  }

  // Support "icon:icon_name" strings from Material Icon Picker
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('icon:')) {
    const iconName = imageUrl.replace('icon:', '');
    return (
      <div className={`${className} item-visual-icon-bg flex items-center justify-center`}>
        <span className="material-symbols-outlined text-amber-400" style={{ fontSize: '2rem' }}>{iconName}</span>
      </div>
    );
  }

  const hasValidImage = Boolean(imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0 && !imgError);
  const icon = getFallbackMaterialIcon(itemName, categoryName);

  if (hasValidImage) {
    return (
      <div className={className}>
        <img
          src={imageUrl.trim()}
          alt={itemName || 'Menu item'}
          className="item-visual-img"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`${className} item-visual-icon-bg flex items-center justify-center`}>
      <span className="material-symbols-outlined text-amber-400" style={{ fontSize: '1.8rem' }}>{icon}</span>
    </div>
  );
}
