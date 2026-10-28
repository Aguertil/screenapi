# 📚 ScreenAPI - Code Examples

## JavaScript / Node.js

### Exemple complet avec tous les devices iPhone

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = 'YOUR_API_KEY';
const API_URL = 'http://localhost:43210/api/v1/screenshot';

const iPhoneDevices = [
  'iphone-15-pro-max',
  'iphone-15-pro',
  'iphone-14-pro-max',
  'iphone-14',
  'iphone-13',
  'iphone-12',
  'iphone-se'
];

async function captureAllIPhones(url) {
  console.log(`📸 Capturing screenshots for ${url}...`);

  for (const device of iPhoneDevices) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          devicePreset: device,
          format: 'PNG'
        })
      });

      if (response.ok) {
        const buffer = await response.buffer();
        const filename = `screenshots/${device}.png`;
        fs.writeFileSync(filename, buffer);
        console.log(`✅ ${device}: ${filename}`);
      } else {
        const error = await response.json();
        console.error(`❌ ${device}: ${error.message}`);
      }
    } catch (err) {
      console.error(`❌ ${device}: ${err.message}`);
    }
  }

  console.log('🎉 Done!');
}

// Utilisation
captureAllIPhones('https://example.com');
```

### Web Scraping avec monitoring

```javascript
const fetch = require('node-fetch');

const API_KEY = 'YOUR_API_KEY';
const SCRAPE_URL = 'http://localhost:43210/api/v1/scrape';

async function scrapeProduct(url) {
  const response = await fetch(SCRAPE_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      extractMetadata: true,
      extractText: true,
      selector: '.product-price'
    })
  });

  const result = await response.json();
  
  if (result.success) {
    return {
      title: result.data.title,
      price: result.data.text,
      image: result.data.metadata.ogImage,
      timestamp: result.data.timestamp
    };
  }

  throw new Error(result.message);
}

// Monitoring toutes les 5 minutes
setInterval(async () => {
  const product = await scrapeProduct('https://shop.example.com/product/123');
  console.log(`[${new Date().toISOString()}] ${product.title}: ${product.price}`);
  
  // Sauvegarder dans une DB ou envoyer une alerte si le prix change
}, 5 * 60 * 1000);
```

## Python

### Client Python avec gestion d'erreurs

```python
import requests
import os
from typing import Optional, Dict, Any

class ScreenAPIClient:
    def __init__(self, api_key: str, base_url: str = "http://localhost:43210"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
    
    def screenshot(
        self,
        url: str,
        device_preset: Optional[str] = None,
        format: str = "PNG",
        full_page: bool = False,
        output_path: Optional[str] = None
    ) -> bytes:
        """Capture un screenshot"""
        data = {
            "url": url,
            "format": format,
            "fullPage": full_page
        }
        
        if device_preset:
            data["devicePreset"] = device_preset
        
        response = requests.post(
            f"{self.base_url}/api/v1/screenshot",
            json=data,
            headers=self.headers
        )
        
        response.raise_for_status()
        
        if output_path:
            with open(output_path, "wb") as f:
                f.write(response.content)
        
        return response.content
    
    def scrape(
        self,
        url: str,
        extract_metadata: bool = True,
        extract_text: bool = True,
        extract_links: bool = False,
        extract_images: bool = False,
        selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """Scrape une page web"""
        data = {
            "url": url,
            "extractMetadata": extract_metadata,
            "extractText": extract_text,
            "extractLinks": extract_links,
            "extractImages": extract_images
        }
        
        if selector:
            data["selector"] = selector
        
        response = requests.post(
            f"{self.base_url}/api/v1/scrape",
            json=data,
            headers=self.headers
        )
        
        response.raise_for_status()
        result = response.json()
        
        if result.get("success"):
            return result["data"]
        
        raise Exception(result.get("message", "Scraping failed"))
    
    def get_devices(self) -> Dict[str, Any]:
        """Liste tous les devices disponibles"""
        response = requests.get(f"{self.base_url}/api/v1/devices")
        response.raise_for_status()
        return response.json()

# Utilisation
if __name__ == "__main__":
    client = ScreenAPIClient(api_key="YOUR_API_KEY")
    
    # Screenshot iPhone 15 Pro
    client.screenshot(
        url="https://example.com",
        device_preset="iphone-15-pro",
        output_path="iphone15.png"
    )
    print("✅ Screenshot saved!")
    
    # Web scraping
    data = client.scrape(
        url="https://example.com",
        extract_metadata=True,
        extract_text=True
    )
    print(f"📄 Title: {data['title']}")
    print(f"📝 Description: {data['metadata']['description']}")
```

### Test responsive avec pytest

```python
import pytest
from screenapi_client import ScreenAPIClient

@pytest.fixture
def client():
    return ScreenAPIClient(api_key="YOUR_API_KEY")

@pytest.mark.parametrize("device", [
    "iphone-15-pro",
    "iphone-14",
    "galaxy-s24-ultra",
    "pixel-8-pro"
])
def test_responsive_design(client, device):
    """Test que le site s'affiche correctement sur tous les devices"""
    screenshot = client.screenshot(
        url="https://mywebsite.com",
        device_preset=device,
        output_path=f"tests/screenshots/{device}.png"
    )
    
    assert len(screenshot) > 0, f"Screenshot vide pour {device}"
    assert len(screenshot) < 5_000_000, f"Screenshot trop gros pour {device}"

def test_seo_metadata(client):
    """Test que les meta tags SEO sont présents"""
    data = client.scrape(
        url="https://mywebsite.com",
        extract_metadata=True
    )
    
    assert data["title"], "Pas de titre"
    assert data["metadata"]["description"], "Pas de description"
    assert data["metadata"]["ogTitle"], "Pas de Open Graph title"
    assert data["metadata"]["ogImage"], "Pas de Open Graph image"
```

## TypeScript

### Client TypeScript avec types

```typescript
interface ScreenshotOptions {
  url: string;
  devicePreset?: string;
  format?: 'PNG' | 'JPEG' | 'WEBP';
  fullPage?: boolean;
  waitForSelector?: string;
  waitForTimeout?: number;
}

interface ScrapeOptions {
  url: string;
  extractMetadata?: boolean;
  extractText?: boolean;
  extractLinks?: boolean;
  extractImages?: boolean;
  selector?: string;
  waitForSelector?: string;
}

interface ScrapedData {
  url: string;
  title?: string;
  metadata?: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  text?: string;
  links?: Array<{ text: string; href: string }>;
  images?: Array<{ alt: string; src: string }>;
  timestamp: string;
}

class ScreenAPI {
  constructor(
    private apiKey: string,
    private baseUrl: string = 'http://localhost:43210'
  ) {}

  async screenshot(options: ScreenshotOptions): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/screenshot`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Screenshot failed');
    }

    return await response.blob();
  }

  async scrape(options: ScrapeOptions): Promise<ScrapedData> {
    const response = await fetch(`${this.baseUrl}/api/v1/scrape`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Scraping failed');
    }

    return result.data;
  }

  async getDevices() {
    const response = await fetch(`${this.baseUrl}/api/v1/devices`);
    return await response.json();
  }
}

// Utilisation
const api = new ScreenAPI('YOUR_API_KEY');

// Screenshot
const blob = await api.screenshot({
  url: 'https://example.com',
  devicePreset: 'iphone-15-pro',
  format: 'PNG',
});

// Web scraping
const data = await api.scrape({
  url: 'https://example.com',
  extractMetadata: true,
  extractText: true,
});

console.log(data.title, data.metadata?.description);
```

## Go

### Client Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type ScreenAPIClient struct {
    APIKey  string
    BaseURL string
}

type ScreenshotRequest struct {
    URL          string `json:"url"`
    DevicePreset string `json:"devicePreset,omitempty"`
    Format       string `json:"format"`
    FullPage     bool   `json:"fullPage"`
}

type ScrapeRequest struct {
    URL             string `json:"url"`
    ExtractMetadata bool   `json:"extractMetadata"`
    ExtractText     bool   `json:"extractText"`
    ExtractLinks    bool   `json:"extractLinks"`
    ExtractImages   bool   `json:"extractImages"`
}

type ScrapeResult struct {
    Success bool `json:"success"`
    Data    struct {
        URL      string `json:"url"`
        Title    string `json:"title"`
        Metadata struct {
            Description   string `json:"description"`
            OGTitle       string `json:"ogTitle"`
            OGDescription string `json:"ogDescription"`
            OGImage       string `json:"ogImage"`
        } `json:"metadata"`
        Text string `json:"text"`
    } `json:"data"`
}

func NewClient(apiKey string) *ScreenAPIClient {
    return &ScreenAPIClient{
        APIKey:  apiKey,
        BaseURL: "http://localhost:43210",
    }
}

func (c *ScreenAPIClient) Screenshot(req ScreenshotRequest) ([]byte, error) {
    body, err := json.Marshal(req)
    if err != nil {
        return nil, err
    }

    httpReq, err := http.NewRequest(
        "POST",
        fmt.Sprintf("%s/api/v1/screenshot", c.BaseURL),
        bytes.NewBuffer(body),
    )
    if err != nil {
        return nil, err
    }

    httpReq.Header.Set("x-api-key", c.APIKey)
    httpReq.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(httpReq)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func (c *ScreenAPIClient) Scrape(req ScrapeRequest) (*ScrapeResult, error) {
    body, err := json.Marshal(req)
    if err != nil {
        return nil, err
    }

    httpReq, err := http.NewRequest(
        "POST",
        fmt.Sprintf("%s/api/v1/scrape", c.BaseURL),
        bytes.NewBuffer(body),
    )
    if err != nil {
        return nil, err
    }

    httpReq.Header.Set("x-api-key", c.APIKey)
    httpReq.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(httpReq)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result ScrapeResult
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return &result, nil
}

func main() {
    client := NewClient("YOUR_API_KEY")

    // Screenshot iPhone 15 Pro
    screenshot, err := client.Screenshot(ScreenshotRequest{
        URL:          "https://example.com",
        DevicePreset: "iphone-15-pro",
        Format:       "PNG",
        FullPage:     false,
    })
    if err != nil {
        panic(err)
    }

    os.WriteFile("screenshot.png", screenshot, 0644)
    fmt.Println("✅ Screenshot saved!")

    // Web scraping
    result, err := client.Scrape(ScrapeRequest{
        URL:             "https://example.com",
        ExtractMetadata: true,
        ExtractText:     true,
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("📄 Title: %s\n", result.Data.Title)
    fmt.Printf("📝 Description: %s\n", result.Data.Metadata.Description)
}
```

## PHP

### Client PHP

```php
<?php

class ScreenAPI {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = 'http://localhost:43210') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    public function screenshot($url, $options = []) {
        $data = array_merge([
            'url' => $url,
            'format' => 'PNG',
            'fullPage' => false
        ], $options);

        $ch = curl_init($this->baseUrl . '/api/v1/screenshot');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $this->apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('Screenshot failed: ' . $httpCode);
        }

        return $response;
    }

    public function scrape($url, $options = []) {
        $data = array_merge([
            'url' => $url,
            'extractMetadata' => true,
            'extractText' => true
        ], $options);

        $ch = curl_init($this->baseUrl . '/api/v1/scrape');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $this->apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);

        if (!$result['success']) {
            throw new Exception('Scraping failed: ' . $result['message']);
        }

        return $result['data'];
    }
}

// Utilisation
$api = new ScreenAPI('YOUR_API_KEY');

// Screenshot iPhone 15
$screenshot = $api->screenshot('https://example.com', [
    'devicePreset' => 'iphone-15-pro',
    'format' => 'PNG'
]);
file_put_contents('screenshot.png', $screenshot);
echo "✅ Screenshot saved!\n";

// Web scraping
$data = $api->scrape('https://example.com', [
    'extractMetadata' => true,
    'extractText' => true
]);
echo "📄 Title: {$data['title']}\n";
echo "📝 Description: {$data['metadata']['description']}\n";
```

## Ruby

### Client Ruby

```ruby
require 'net/http'
require 'json'

class ScreenAPI
  def initialize(api_key, base_url = 'http://localhost:43210')
    @api_key = api_key
    @base_url = base_url
  end

  def screenshot(url, options = {})
    data = {
      url: url,
      format: options[:format] || 'PNG',
      fullPage: options[:full_page] || false
    }
    data[:devicePreset] = options[:device_preset] if options[:device_preset]

    uri = URI("#{@base_url}/api/v1/screenshot")
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri.path)
    request['x-api-key'] = @api_key
    request['Content-Type'] = 'application/json'
    request.body = data.to_json

    response = http.request(request)
    raise "Screenshot failed: #{response.code}" unless response.code == '200'

    response.body
  end

  def scrape(url, options = {})
    data = {
      url: url,
      extractMetadata: options[:extract_metadata] || true,
      extractText: options[:extract_text] || true,
      extractLinks: options[:extract_links] || false,
      extractImages: options[:extract_images] || false
    }

    uri = URI("#{@base_url}/api/v1/scrape")
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri.path)
    request['x-api-key'] = @api_key
    request['Content-Type'] = 'application/json'
    request.body = data.to_json

    response = http.request(request)
    result = JSON.parse(response.body)

    raise "Scraping failed: #{result['message']}" unless result['success']

    result['data']
  end
end

# Utilisation
api = ScreenAPI.new('YOUR_API_KEY')

# Screenshot iPhone 15
screenshot = api.screenshot('https://example.com', {
  device_preset: 'iphone-15-pro',
  format: 'PNG'
})
File.write('screenshot.png', screenshot)
puts '✅ Screenshot saved!'

# Web scraping
data = api.scrape('https://example.com', {
  extract_metadata: true,
  extract_text: true
})
puts "📄 Title: #{data['title']}"
puts "📝 Description: #{data['metadata']['description']}"
```

## cURL

### Exemples cURL

```bash
# Screenshot iPhone 15 Pro
curl -X POST http://localhost:43210/api/v1/screenshot \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","devicePreset":"iphone-15-pro","format":"PNG"}' \
  --output iphone15.png

# Screenshot Samsung Galaxy S24 Ultra
curl -X POST http://localhost:43210/api/v1/screenshot \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","devicePreset":"galaxy-s24-ultra","format":"PNG"}' \
  --output galaxy-s24.png

# Web scraping avec métadonnées
curl -X POST http://localhost:43210/api/v1/scrape \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","extractMetadata":true,"extractText":true}' \
  | jq '.'

# Lister tous les devices
curl http://localhost:43210/api/v1/devices | jq '.devices[] | {id, name, width, height, category}'
```
