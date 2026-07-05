# SmartMenuAI API

Base URL: `http://localhost:4000/api`

## Authentication

- `POST /auth/register` creates a customer account and returns a JWT.
- `POST /auth/login` authenticates a customer and returns a JWT.

## Products

- `GET /products` lists available products.
- `GET /products/:id` returns one product.
- `POST /products` creates a product.
- `PUT /products/:id` updates a product.
- `DELETE /products/:id` removes a product.

## Categories

- `GET /categories` lists categories.
- `POST /categories` creates a category.

## Orders

- `GET /orders` lists orders.
- `GET /orders/:id` returns one order.
- `POST /orders` creates an order with order items.
- `PUT /orders/:id/status` updates order status.

## Tables

- `GET /tables` lists restaurant tables.
- `POST /tables` creates a table and generates a QR code data URL.
