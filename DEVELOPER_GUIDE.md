# 🚀 ScreenAPI - Developer Guide

## Vue d'ensemble

ScreenAPI est une API professionnelle de capture d'écran et de web scraping conçue pour les développeurs. Elle offre:

- **20+ presets de devices mobiles** (iPhone, Samsung, Pixel, iPad, etc.)
- **Web scraping avancé** (métadonnées, texte, liens, images)
- **Rate limiting intelligent** avec Redis
- **Authentification par API key**
- **Support multi-formats** (PNG, JPEG, WEBP)

## 📱 Device Presets

### iPhones les plus populaires

```javascript
// iPhone 15 Pro Max (430×932)
const response = await fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    devicePreset: 'iphone-15-pro-max',
    format: 'PNG'
  })
});

// iPhone 14 Pro Max (430×932)
devicePreset: 'iphone-14-pro-max'

// iPhone 14 (390×844)
devicePreset: 'iphone-14'

// iPhone 13 (390×844)
devicePreset: 'iphone-13'

// iPhone 12 (390×844)
devicePreset: 'iphone-12'

// iPhone SE 3rd gen (375×667)
devicePreset: 'iphone-se'
```

### Android Best Sellers

```javascript
// Samsung Galaxy S24 Ultra (412×915)
devicePreset: 'galaxy-s24-ultra'

// Samsung Galaxy S23 (360×780)
devicePreset: 'galaxy-s23'

// Samsung Galaxy A54 (412×915)
devicePreset: 'galaxy-a54'

// Google Pixel 8 Pro (412×915)
devicePreset: 'pixel-8-pro'

// Google Pixel 7 (412×915)
devicePreset: 'pixel-7'
```

### Tablets

```javascript
// iPad Pro 12.9" (1024×1366)
devicePreset: 'ipad-pro-12.9'

// iPad Air (820×1180)
devicePreset: 'ipad-air'

// Samsung Galaxy Tab S9 (800×1280)
devicePreset: 'galaxy-tab-s9'
```

### Desktop Resolutions

```javascript
// Full HD 1920×1080
devicePreset: 'desktop-1920'

// 2K 2560×1440
devicePreset: 'desktop-1440'

// MacBook Pro 16" (1728×1117)
devicePreset: 'macbook-pro-16'
```

## 🕷️ Web Scraping

### Extraire les métadonnées d'une page

```javascript
const response = await fetch('http://localhost:43210/api/v1/scrape', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    extractMetadata: true,
    extractText: true
  })
});

const data = await response.json();
console.log(data);

/* Résultat:
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "metadata": {
      "description": "Example page description",
      "keywords": "example, test, demo",
      "ogTitle": "Example Domain",
      "ogDescription": "This is an example",
      "ogImage": "https://example.com/og-image.jpg",
      "twitterCard": "summary_large_image"
    },
    "text": "This domain is for use in...",
    "timestamp": "2026-10-28T09:00:00.000Z"
  }
}
*/
```

### Extraire tous les liens d'une page

```javascript
const response = await fetch('http://localhost:43210/api/v1/scrape', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    extractLinks: true
  })
});

const data = await response.json();
console.log(data.data.links);

/* Résultat:
[
  { "text": "Home", "href": "/" },
  { "text": "About", "href": "/about" },
  { "text": "Contact", "href": "/contact" }
]
*/
```

### Extraire toutes les images

```javascript
const response = await fetch('http://localhost:43210/api/v1/scrape', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    extractImages: true
  })
});

const data = await response.json();
console.log(data.data.images);

/* Résultat:
[
  { "alt": "Logo", "src": "https://example.com/logo.png" },
  { "alt": "Banner", "src": "https://example.com/banner.jpg" }
]
*/
```

### Extraire du contenu d'un sélecteur spécifique

```javascript
const response = await fetch('http://localhost:43210/api/v1/scrape', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    selector: '.main-content',
    extractText: true
  })
});
```

## 📸 Screenshots Avancés

### Screenshot pleine page mobile

```javascript
const response = await fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    devicePreset: 'iphone-15-pro',
    fullPage: true,
    format: 'PNG'
  })
});

const blob = await response.blob();
// Sauvegarder ou afficher l'image
```

### Screenshot avec attente d'un élément

```javascript
const response = await fetch('http://localhost:43210/api/v1/screenshot', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    devicePreset: 'galaxy-s24-ultra',
    waitForSelector: '.content-loaded',
    waitForTimeout: 5000,
    format: 'WEBP'
  })
});
```

### Comparer plusieurs devices

```javascript
const devices = [
  'iphone-15-pro',
  'galaxy-s24-ultra',
  'pixel-8-pro',
  'ipad-air'
];

const screenshots = await Promise.all(
  devices.map(async (device) => {
    const response = await fetch('http://localhost:43210/api/v1/screenshot', {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        devicePreset: device,
        format: 'PNG'
      })
    });
    
    return {
      device,
      blob: await response.blob()
    };
  })
);

console.log('Screenshots capturés pour:', screenshots.map(s => s.device));
```

## 🔑 Lister tous les devices disponibles

```javascript
const response = await fetch('http://localhost:43210/api/v1/devices');
const data = await response.json();

console.log(data);

/* Résultat:
{
  "success": true,
  "devices": [
    {
      "id": "iphone-15-pro-max",
      "name": "iPhone 15 Pro Max",
      "width": 430,
      "height": 932,
      "category": "phone",
      "deviceScaleFactor": 3
    },
    ...
  ],
  "categories": {
    "phone": [...],
    "tablet": [...],
    "desktop": [...]
  },
  "total": 20
}
*/
```

## 🐍 Exemples Python

### Screenshot avec requests

```python
import requests

api_key = "YOUR_API_KEY"
url = "http://localhost:43210/api/v1/screenshot"

headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

data = {
    "url": "https://example.com",
    "devicePreset": "iphone-15-pro",
    "format": "PNG"
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 200:
    with open("screenshot.png", "wb") as f:
        f.write(response.content)
    print("Screenshot saved!")
```

### Web scraping avec Python

```python
import requests
import json

api_key = "YOUR_API_KEY"
url = "http://localhost:43210/api/v1/scrape"

headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

data = {
    "url": "https://example.com",
    "extractMetadata": True,
    "extractText": True,
    "extractLinks": True
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

if result["success"]:
    print("Title:", result["data"]["title"])
    print("Description:", result["data"]["metadata"]["description"])
    print("Links:", len(result["data"]["links"]))
```

## 🎯 Cas d'usage typiques

### 1. Testing responsive design

Testez votre site sur tous les devices populaires:

```javascript
const testDevices = async (url) => {
  const devices = [
    'iphone-15-pro',
    'iphone-se',
    'galaxy-s24-ultra',
    'pixel-8-pro',
    'ipad-air',
    'desktop-1920'
  ];

  for (const device of devices) {
    const response = await fetch('http://localhost:43210/api/v1/screenshot', {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        devicePreset: device,
        format: 'PNG'
      })
    });

    const blob = await response.blob();
    // Sauvegarder avec le nom du device
  }
};

testDevices('https://mywebsite.com');
```

### 2. Monitoring de contenu

Surveillez les changements sur une page:

```javascript
const monitorPage = async (url) => {
  const response = await fetch('http://localhost:43210/api/v1/scrape', {
    method: 'POST',
    headers: {
      'x-api-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      extractText: true,
      selector: '.price'
    })
  });

  const data = await response.json();
  const price = data.data.text;
  
  // Comparer avec la dernière valeur stockée
  if (price !== lastPrice) {
    sendAlert(`Prix changé: ${price}`);
  }
};
```

### 3. SEO Audit

Extraire toutes les métadonnées SEO:

```javascript
const seoAudit = async (url) => {
  const response = await fetch('http://localhost:43210/api/v1/scrape', {
    method: 'POST',
    headers: {
      'x-api-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      extractMetadata: true,
      extractLinks: true
    })
  });

  const data = await response.json();
  const { title, metadata, links } = data.data;

  return {
    title,
    description: metadata.description,
    ogTags: {
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      image: metadata.ogImage
    },
    twitterCard: metadata.twitterCard,
    internalLinks: links.filter(l => l.href.startsWith('/')).length,
    externalLinks: links.filter(l => l.href.startsWith('http')).length
  };
};
```

## ⚡ Performance Tips

1. **Utilisez le bon format**:
   - PNG: qualité maximale, gros fichiers
   - JPEG: bon compromis qualité/taille
   - WEBP: meilleure compression (recommandé)

2. **Évitez fullPage si pas nécessaire**:
   - `fullPage: false` est beaucoup plus rapide
   - Utilisez uniquement quand vous avez besoin de toute la page

3. **Batch requests**:
   - Utilisez `Promise.all()` pour paralléliser
   - Respectez les rate limits

4. **Cache les device presets**:
   - Appelez `/api/v1/devices` une seule fois
   - Stockez la liste côté client

## 🔒 Rate Limits

- **Free tier**: 100 requêtes/jour
- **Pro tier**: 10,000 requêtes/jour
- **Enterprise**: Illimité

Les headers de rate limiting sont inclus dans chaque réponse:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2026-10-29T00:00:00.000Z
```

## 🆘 Support

- 📖 Documentation: http://localhost:43210/docs
- 🎮 Playground: http://localhost:43210/playground
- 📊 Dashboard: http://localhost:43210/dashboard
