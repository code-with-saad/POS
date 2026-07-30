import { useState } from 'react';

/**
 * Returns a relevant emoji/icon based on item name and category name
 */
export function getFallbackIcon(itemName = '', categoryName = '') {
  const name = itemName.toLowerCase();
  const cat = categoryName.toLowerCase();

  // Name keyword matches
  if (name.includes('espresso')) return '☕';
  if (name.includes('cappuccino') || name.includes('latte') || name.includes('mocha')) return '☕';
  if (name.includes('chai') || name.includes('tea')) return '🫖';
  if (name.includes('margarita') || name.includes('slush') || name.includes('mojito')) return '🍸';
  if (name.includes('iced') || name.includes('cold') || name.includes('shake') || name.includes('smoothie')) return '🥤';
  if (name.includes('burger') || name.includes('zinger')) return '🍔';
  if (name.includes('sandwich') || name.includes('club')) return '🥪';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('fries') || name.includes('chips')) return '🍟';
  if (name.includes('cake') || name.includes('brownie')) return '🍰';
  if (name.includes('ice cream') || name.includes('gelato')) return '🍨';
  if (name.includes('wrap') || name.includes('shawarma')) return '🌯';
  if (name.includes('pasta') || name.includes('spaghetti')) return '🍝';
  if (name.includes('wing') || name.includes('nugget') || name.includes('chicken')) return '🍗';

  // Category fallback matches
  if (cat.includes('hot') || cat.includes('beverage')) return '☕';
  if (cat.includes('cold') || cat.includes('drink')) return '🥤';
  if (cat.includes('food') || cat.includes('fast') || cat.includes('main')) return '🍔';
  if (cat.includes('dessert') || cat.includes('sweet')) return '🍰';
  if (cat.includes('snack') || cat.includes('side')) return '🍿';

  return '🍽️';
}

/**
 * Renders product image if valid imageUrl is provided,
 * otherwise renders a styled container with fallback icon by name/category.
 */
export default function ItemVisual({ imageUrl, itemName, categoryName, className = 'item-visual-box' }) {
  const [imgError, setImgError] = useState(false);

  const hasValidImage = imageUrl && imageUrl.trim().length > 0 && !imgError;
  const icon = getFallbackIcon(itemName, categoryName);

  if (hasValidImage) {
    return (
      <div className={className}>
        <img
          src={imageUrl}
          alt={itemName}
          className="item-visual-img"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`${className} item-visual-icon-bg`}>
      <span className="item-visual-emoji">{icon}</span>
    </div>
  );
}
