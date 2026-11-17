export const seedData = {
  "categories": [
    {
      "id": 1,
      "name": "Popcorn",
      "slug": "popcorn",
      "sortOrder": 1,
      "customizationConfig": {
        "type": "percentage_mix",
        "step": 25,
        "unit": "%",
        "allowMix": true,
        "defaultFlavor": "Cheese"
      }
    },
    {
      "id": 2,
      "name": "Mini Donut",
      "slug": "mini-donut",
      "sortOrder": 2,
      "customizationConfig": {
        "type": "multi_select",
        "maxFlavors": 8,
        "groups": [
          "Donut Syrup",
          "Donut Choco Dip",
          "Donut Topping"
        ]
      }
    }
  ],
  "products": [
    {
      "name": "J-Pop Gourmet Popcorn (500g)",
      "description": "Crispy, freshly popped monster-mushroom popcorn seasoned to perfection. Choose single flavor or create your custom percentage mix!",
      "basePrice": "35.00",
      "price": "35.00",
      "sizeLabel": "500g",
      "category": "popcorn",
      "categoryId": 1,
      "flavors": [
        "Spicy BBQ",
        "Sour Cream & Onion",
        "Cheese",
        "BBQ"
      ],
      "sizes": [
        "500g Resealable Pouch"
      ],
      "isActive": true,
      "sortOrder": 1,
      "imageUrl": "/products/popcorn-500g.jpg"
    },
    {
      "name": "J-Pop Gourmet Popcorn (1kg Party Bag)",
      "description": "Massive 1kg jumbo party bag! Freshly popped daily. Buy 5+ units to qualify for 100% FREE SHIPPING across eligible areas!",
      "basePrice": "60.00",
      "price": "60.00",
      "sizeLabel": "1kg",
      "category": "popcorn",
      "categoryId": 1,
      "flavors": [
        "Spicy BBQ",
        "Sour Cream & Onion",
        "Cheese",
        "BBQ"
      ],
      "sizes": [
        "1kg Jumbo Party Bag"
      ],
      "isActive": true,
      "sortOrder": 2,
      "imageUrl": "/products/popcorn-1kg.jpg"
    },
    {
      "name": "Mini Donuts (Box of 8)",
      "description": "Fluffy, freshly fried mini donuts. Pick up to 8 unique flavor combinations with artisan syrups, rich chocolate dips, and crunchy toppings!",
      "basePrice": "99.00",
      "price": "99.00",
      "sizeLabel": "Box of 8",
      "category": "mini-donut",
      "categoryId": 2,
      "flavors": [
        "Assorted Custom Mix"
      ],
      "sizes": [
        "8 Pieces Box"
      ],
      "isActive": true,
      "sortOrder": 3,
      "imageUrl": "/products/donuts-8.jpg"
    },
    {
      "name": "Mini Donuts (Box of 16 Jumbo)",
      "description": "16 warm, golden-brown mini donuts with custom syrups, warm choco dip glazes, and delightful rainbow toppings.",
      "basePrice": "180.00",
      "price": "180.00",
      "sizeLabel": "Box of 16",
      "category": "mini-donut",
      "categoryId": 2,
      "flavors": [
        "Assorted Custom Mix"
      ],
      "sizes": [
        "16 Pieces Box"
      ],
      "isActive": true,
      "sortOrder": 4,
      "imageUrl": "/products/donuts-16.jpg"
    }
  ],
  "customizationOptions": [
    {
      "categoryId": 1,
      "groupName": "Popcorn Flavor",
      "name": "Spicy BBQ",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 1,
      "groupName": "Popcorn Flavor",
      "name": "Sour Cream & Onion",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 1,
      "groupName": "Popcorn Flavor",
      "name": "Cheese",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 1,
      "groupName": "Popcorn Flavor",
      "name": "BBQ",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Syrup",
      "name": "Chocolate",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Syrup",
      "name": "Ube",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Syrup",
      "name": "Caramel",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Syrup",
      "name": "Matcha",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Syrup",
      "name": "Strawberry",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Syrup",
      "name": "Blueberry",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Choco Dip",
      "name": "Chocolate",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Choco Dip",
      "name": "White Chocolate",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Topping",
      "name": "Rainbow Mini Marshmallows",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Topping",
      "name": "White Chocolate Chips",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Topping",
      "name": "Chocolate Chips",
      "extraPrice": "0.00",
      "isAvailable": true
    },
    {
      "categoryId": 2,
      "groupName": "Donut Topping",
      "name": "Sprinkles",
      "extraPrice": "0.00",
      "isAvailable": true
    }
  ],
  "settings": {
    "qr_codes": {
      "gcash": {
        "label": "GCash",
        "accountName": "Joseph Zen Castro",
        "accountNumber": "0912-345-6789",
        "imageUrl": "/qr/gcash.jpg"
      },
      "maya": {
        "label": "Maya",
        "accountName": "Joseph Zen Castro",
        "accountNumber": "0912-345-6789",
        "imageUrl": "/qr/maya.jpg"
      },
      "instapay": {
        "label": "InstaPay",
        "accountName": "Joseph Zen Castro (Maribank)",
        "accountNumber": "10555184277",
        "imageUrl": "/qr/instapay.png"
      }
    },
    "faq": [
      {
        "question": "Chat Live Seller",
        "answer": "Connecting you directly to our live Facebook Messenger inbox! Our multi-admin team is ready to assist you with inquiries, custom flavor orders, and bulk delivery."
      },
      {
        "question": "Can I pick up my order?",
        "answer": "Yes! You can choose 'Store Pickup' at checkout with ₱0 shipping fee.\n📍 Pickup Location: J-Pop Corner, Poblacion, San Juan, Abra.\n⏱️ Prep Time: 15–30 minutes fresh from popping/frying. You will receive a ready-for-pickup notification!"
      },
      {
        "question": "My Area is not listed on the shipping options.",
        "answer": "If your exact barangay or municipality outside Abra isn't listed, simply choose 'Store Pickup' or message our Live Seller on Facebook Messenger with your exact address. We partner with local courier and bus dispatch services for special delivery quotes!"
      },
      {
        "question": "Operating Hours",
        "answer": "🕒 Store Hours: Monday to Saturday, 9:00 AM – 8:00 PM.\n⏰ Order Cut-off: 7:30 PM for same-day delivery or pickup. Orders placed after cut-off are queued for next morning popping!"
      },
      {
        "question": "Payment methods",
        "answer": "We support 3 flexible payment methods:\n1. 💵 Cash (Cash on Delivery or Cash on Pickup)\n2. 📱 Manual QR Ph / E-Wallet (GCash, Maya, InstaPay bank transfer with receipt upload)\n3. 💳 Automated Online Gateway (Credit/Debit cards, Maya & QR Ph via PayMongo / HitPay)"
      }
    ],
    "site_customization": {
      "heroTitle": "J-Pop Corner — Fresh Gourmet Snacks & Custom Treats",
      "heroSubtitle": "Artisan monster-mushroom popcorn with custom flavor mix sliders & freshly glazed mini donuts. Popped fresh daily in Abra!",
      "primaryColor": "#C23616",
      "accentColor": "#F9CA24",
      "bannerAnnouncement": "🎉 FREE DELIVERY PROMO: Order 5+ units of 1kg Popcorn (₱60) or 10+ units of 500g Popcorn (₱35) for automatic free shipping!"
    },
    "facebook_messenger": {
      "enabled": true,
      "url": "https://m.me/2725998090803875",
      "label": "Chat with Team on Messenger",
      "username": "2725998090803875",
      "pageId": "2725998090803875"
    }
  }
};
export default seedData;
