# Valentina BCS - Designer Portfolio Website

A minimal, elegant designer portfolio website built with clean HTML, CSS, and JavaScript. The design features a sophisticated beige color palette with serif typography, perfect for showcasing creative work.

## Design Features

- **Minimalist Aesthetic**: Clean, spacious layout inspired by luxury design
- **Elegant Typography**: Serif headings (Playfair Display) with sans-serif body text (Inter)
- **Responsive Design**: Mobile-first approach with fluid layouts
- **Smooth Interactions**: Subtle hover effects and scroll animations
- **Accessible**: Semantic HTML with ARIA labels

## Project Structure

```
ValentinaWebsite/
├── index.html           # Home/Landing page
├── css/
│   └── style.css        # Main stylesheet with design system
├── js/
│   └── script.js        # Interactive functionality
└── README.md            # This file
```

## Pages

### Home (index.html)
- Hero section with site title and tagline
- Featured work preview
- About section preview

## Color Palette

- **Background**: `#f5f1ed` (Warm beige)
- **Text**: `#2c2c2c` (Dark gray)
- **Accent**: `#d4a574` (Gold)
- **Borders**: `#e0dcd8` (Light beige)

## Typography

- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Font sizes**: Responsive with CSS clamp()

## Getting Started

### Option 1: Open Locally
1. Open `index.html` in your web browser
2. Navigate between pages using the menu

### Option 2: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js with http-server
npx http-server
```

Then visit `http://localhost:8000`

## Customization

### Add Portfolio Projects
Add new portfolio items to the grid in `index.html`:
```html
<article class="work-item">
    <div class="work-placeholder"></div>
    <h3>Project Name</h3>
    <p>Design Categories</p>
</article>
```

### Customize Colors
Update CSS variables in `css/style.css`:
```css
:root {
    --color-bg: #f5f1ed;
    --color-dark: #1a1a1a;
    --color-accent: #d4a574;
    /* ... etc */
}
```

## Features

- ✨ Smooth scroll navigation
- 📱 Fully responsive (mobile, tablet, desktop)
- ♿ Semantic HTML for accessibility
- 🎨 CSS custom properties for easy customization
- 🚀 No dependencies - pure HTML/CSS/JS
- 📊 Intersection Observer for scroll animations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] Individual project detail pages
- [ ] Blog/Articles section
- [ ] Dark mode toggle
- [ ] Image lazy loading
- [ ] Contact page with form
- [ ] Project filtering/categories

## License

© 2026 Valentina BCS. All rights reserved.
