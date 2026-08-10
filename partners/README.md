# Partners App

## Purpose

The `partners` app manages the relationship between Bloomprint and its business partners. It supports two types of partners:
- **Non-Delivery (Referral) Partners:** These partners refer users to Bloomprint and earn a commission on the first three successful payments.
- **Delivery Partners:** These partners fulfill deliveries in their local service area. They have a public landing page (via `booking_slug`) and can receive delivery requests.

## Models

- **Partner:** The central model, linked to a Django `User`. Contains business details, location (for delivery matching), and Stripe Connect account info.
- **DiscountCode:** A unique code assigned to a partner that users can use to get a discount.
- **Commission:** Records earnings for partners (referral or fulfillment).
- **DeliveryRequest:** Manages the lifecycle of a delivery assignment (notified, accepted, declined).
- **Payout:** Tracks payments made to partners via Stripe Connect.

## Testing

The `partners` app has a comprehensive test suite:

- **Util Tests:** Covers commission calculation logic and the delivery reassignment algorithm.
- **View Tests:** Covers:
    - Partner registration and JWT token issuance.
    - Dashboard data aggregation (commissions, payouts, discount codes).
    - Profile updates (including unique slug validation).
    - Public slug resolution for landing pages.
    - Discount code validation (including rate limiting and "new customer" checks).
    - Delivery request response flow (accept, decline, mark delivered).
    - Stripe Connect onboarding and status tracking (mocked).
    - Payout listing and line-item details.

Run tests using: `pytest partners/tests`
