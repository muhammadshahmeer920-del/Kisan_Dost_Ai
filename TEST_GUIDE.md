# Dairy Store Refactoring - Test Guide

## Overview
This guide validates the new ownership-based permissions and order creation flow in the Dairy Store component.

## Test Scenarios

### Test 1: Ownership Permission Enforcement

**Objective:** Verify that users can only edit/delete/manage their own products

**Setup:**
1. Create two mock users in the system:
   - **User A (Farm "Al-Madina Dairy")** - ID: `usr_farm_a`
   - **User B (Farm "Noor Dairy")** - ID: `usr_farm_b`

2. Create test products:
   - Product 1 (seller_id: `usr_farm_a`): "Fresh Milk 1L"
   - Product 2 (seller_id: `usr_farm_b`): "Fresh Ghee 500g"
   - Product 3 (seller_id: `usr_farm_a`): "Yogurt 2kg"

**Test Steps:**

#### A. User A viewing as owner (should see management controls)
1. Log in as User A
2. Navigate to Dairy Store
3. Look for "Your Listings" section
4. Verify for Product 1 and Product 3:
   - ✓ Green border (emerald-300)
   - ✓ "⭐ آپ کا اشتہار" (Your Listing) badge
   - ✓ Edit button (pencil icon)
   - ✓ Delete button (trash icon)
   - ✓ Stock Toggle button
   - ✓ Quick Price button

#### B. User A viewing non-owner product (should NOT see controls)
1. Stay logged in as User A
2. Scroll to "Available from Other Farms" section
3. Verify Product 2 (seller_id: `usr_farm_b`):
   - ✓ Standard border (no emerald highlight)
   - ✓ NO owner badge
   - ✓ NO Edit button
   - ✓ NO Delete button
   - ✓ NO Stock Toggle
   - ✓ NO Quick Price button
   - ✓ "🛒 آرڈر کریں" (Buy Now) button present

#### C. Try to edit non-owner product (should fail)
1. Stay logged in as User A
2. Try to manually access: `handleOpenEdit(Product2)`
3. Verify alert shows: "یہ پروڈکٹ آپ کا نہیں ہے۔" (This product is not yours)
4. Verify edit form does NOT open

#### D. Switch to User B and verify permissions
1. Log out as User A
2. Log in as User B
3. Verify User B sees:
   - Product 2 in "Your Listings" section (with controls)
   - Product 1 & 3 in "Available from Other Farms" (no controls)

---

### Test 2: Product Listing Separation

**Objective:** Verify products are correctly separated into two sections

**Setup:**
- Use same products and users from Test 1

**Test Steps:**

#### A. Check section visibility
1. Log in as User A (owner of 2 products)
2. Verify Dairy Store renders:
   - ✓ "Your Listings" section with 2 products (Product 1, 3)
   - ✓ Section divider with emerald gradient
   - ✓ "Available from Other Farms" section with 1 product (Product 2)
   - ✓ Section divider with blue gradient

#### B. Check section headers
1. Verify "Your Listings" header shows:
   - ✓ "⭐ آپ کی اشتہاریں (Your Listings) - 2"
   - ✓ Emerald badge styling
2. Verify "Available from Other Farms" header shows:
   - ✓ "🛒 دیگر فارمز سے خریداری (Available from Other Farms) - 1"
   - ✓ Blue badge styling

#### C. Check with no own listings
1. Create a new test user (User C) with no products
2. Log in as User C
3. Verify:
   - ✓ "Your Listings" section does NOT appear (ownListings.length === 0)
   - ✓ "Available from Other Farms" section shows all products (1-3)

---

### Test 3: Order Creation Flow

**Objective:** Verify complete order placement from buyer perspective

**Setup:**
- Log in as User A (buyer perspective)
- Product 2 by User B is available (seller_id: `usr_farm_b`)

**Test Steps:**

#### A. Open checkout modal
1. In "Available from Other Farms" section, find Product 2
2. Click "🛒 آرڈر کریں" (Buy Now) button
3. Verify checkout modal opens with:
   - ✓ Product name: "Fresh Ghee 500g"
   - ✓ Product image displayed
   - ✓ Product price: correct PKR value
   - ✓ Default quantity: 1
   - ✓ Farm name: "Noor Dairy"
   - ✓ Seller city: displayed

#### B. Fill checkout form
1. Verify form fields available:
   - ✓ Customer Name (defaults to buyer's name)
   - ✓ Phone Number (defaults to buyer's phone)
   - ✓ Email (defaults to buyer's email, disabled)
   - ✓ Delivery Address field
   - ✓ Quantity selector (can increase/decrease)
   - ✓ Payment Method dropdown:
     - cod (Cash on Delivery)
     - mobile_wallet (JazzCash/EasyPaisa)
     - bank_transfer (Bank Transfer)

2. Fill form with test data:
   - Customer Name: "Muhammad Ali"
   - Phone: "03001234567"
   - Address: "House 123, Street ABC, Lahore"
   - Quantity: 2
   - Payment Method: "mobile_wallet"

#### C. Calculate total
1. Verify total calculation:
   - If Product 2 price = 500 PKR/unit
   - Expected total = 500 × 2 = 1000 PKR
   - ✓ Display shows: "Total: PKR 1,000"

#### D. Submit order
1. Click "✓ تصدیق کریں / Confirm Order" button
2. Verify Order object created with:
   ```
   {
     id: "KD-" + 6-digit number (e.g., "KD-123456")
     buyerId: "usr_farm_a"
     sellerId: "usr_farm_b"
     productId: Product2.id
     productName: "Fresh Ghee 500g"
     quantity: 2
     totalAmountPKR: 1000
     buyerName: "Muhammad Ali"
     buyerPhone: "03001234567"
     buyerEmail: user.email
     deliveryAddress: "House 123, Street ABC, Lahore"
     paymentMethod: "mobile_wallet"
     paymentStatus: "pending"
     status: "pending"
     createdAt: current ISO timestamp
     sellerName: "Noor Farm Owner"
     sellerFarmName: "Noor Dairy"
     sellerPhone: "03109876543"
     // ... other fields
   }
   ```

---

### Test 4: Order Confirmation Modal

**Objective:** Verify receipt/confirmation displays correct order details

**Setup:**
- Complete Test 3 (order submission)

**Test Steps:**

#### A. Check confirmation modal appears
1. After order submission, modal should appear:
   - ✓ Modal title: "Order Placed Successfully!"
   - ✓ Invoice ID: "KD-XXXXXX"
   - ✓ Blue checkmark icon
   - ✓ Success badge

#### B. Verify receipt details
1. Check displayed information:
   - ✓ Product: "Fresh Ghee 500g (2x)"
   - ✓ Total Amount: "PKR 1,000"
   - ✓ Buyer: "Muhammad Ali (03001234567)"
   - ✓ Payment Method: "MOBILE_WALLET" (uppercase)
   - ✓ Farm: "Noor Dairy"

#### C. Check notification message
1. Verify info box shows:
   - ✓ Text: "✅ فارم کے مالک آپ سے جلد رابطہ کریں گے۔"
   - ✓ Text: "براہ کرم اپنے فون کو دستیاب رکھیں۔"
   - ✓ Blue styling

#### D. Dismiss modal
1. Click "شکریہ! واپس ڈیری شاپ پر جائیں" button
2. Verify:
   - ✓ Modal closes
   - ✓ Returns to Dairy Store view
   - ✓ Product grid still displays

---

### Test 5: Stock Management

**Objective:** Verify stock toggle works for own products

**Setup:**
- Log in as User A
- Product 1 is in "Your Listings" with `inStock: true`

**Test Steps:**

#### A. Toggle stock to "Out of Stock"
1. Find "Toggle Stock" button on Product 1 card
2. Click "بند کریں" (Mark as Out of Stock) button
3. Verify:
   - ✓ Stock badge changes to "✕ ختم"
   - ✓ Button text changes to "فعال کریں" (Mark In Stock)
   - ✓ Button styling changes from amber to green

#### B. Buy button shows disabled state
1. Switch to non-owner perspective (or use different browser session)
2. Find Product 1 in "Available from Other Farms"
3. Verify:
   - ✓ Buy button is disabled (grayed out)
   - ✓ Button text: "✕ ختم" (Out of Stock)
   - ✓ Cursor shows not-allowed

#### C. Toggle back to In Stock
1. Return to owner perspective (User A)
2. Click "فعال کریں" button
3. Verify:
   - ✓ Stock badge changes to "✓ دستیاب"
   - ✓ Button text changes to "بند کریں"
   - ✓ Button styling changes back to amber

#### D. Buy button enabled for buyers
1. Check Product 1 from buyer perspective
2. Verify "🛒 آرڈر کریں" button is enabled and functional

---

### Test 6: Quick Price Edit

**Objective:** Verify quick price editing for own products

**Setup:**
- Log in as User A
- Product 1 (own product) in "Your Listings"
- Current price: 500 PKR

**Test Steps:**

#### A. Open quick price modal
1. On Product 1 card, click "$" (Quick Price button)
2. Verify modal opens with:
   - ✓ Product name
   - ✓ Current price input: 500
   - ✓ Price field is editable

#### B. Edit price
1. Clear current price
2. Enter new price: 450
3. Click "Save Price" button
4. Verify:
   - ✓ Modal closes
   - ✓ Product card updates to show "PKR 450"
   - ✓ Change reflects immediately in UI

#### C. Verify non-owners can't edit
1. Switch to User B perspective
2. Check Product 1 in "Available from Other Farms"
3. Verify NO quick price button appears
4. Only "🛒 آرڈر کریں" button visible

---

### Test 7: Bilingual Support & RTL

**Objective:** Verify Urdu text and RTL support works correctly

**Setup:**
- Have language toggle available in UI
- Set language to Urdu ("ur")

**Test Steps:**

#### A. Check product card translations
1. Set language to Urdu
2. Verify on product cards:
   - ✓ "آپ کا اشتہار" appears (Your Listing badge)
   - ✓ "دستیاب" / "ختم" (In Stock / Out of Stock)
   - ✓ "آرڈر کریں" (Buy Now button)
   - ✓ "100% آرگینک" (Organic badge)
   - ✓ All text is right-aligned (RTL)

#### B. Check section headers in Urdu
1. Verify section dividers show:
   - ✓ "⭐ آپ کی اشتہاریں (Your Listings)"
   - ✓ "🛒 دیگر فارمز سے خریداری (Available from Other Farms)"
   - ✓ Proper right-to-left text direction

#### C. Check form labels in Urdu
1. Open checkout modal
2. Verify form fields:
   - ✓ "خریدار کا نام" (Customer Name)
   - ✓ "فون نمبر" (Phone Number)
   - ✓ "ڈیلیوری ایڈریس" (Delivery Address)
   - ✓ "مقدار" (Quantity)
   - ✓ "ادائیگی کا طریقہ" (Payment Method)

#### D. Check confirmation modal in Urdu
1. Complete an order
2. Verify receipt shows:
   - ✓ "آرڈر کامیابی سے درج ہو گیا!" (Order placed successfully)
   - ✓ "پروڈکٹ:" (Product)
   - ✓ "کل رقم:" (Total Amount)
   - ✓ "خریدار:" (Buyer)
   - ✓ All Urdu text proper direction

---

## Expected Behavior Summary

| Action | User A (Owner) | User B (Buyer) |
|--------|---|---|
| View own product | Edit, Delete, Stock, Price | N/A |
| View other product | N/A | Buy Now |
| Create order | N/A | ✓ Opens modal |
| Place order | N/A | ✓ Creates Order object |
| Stock toggle | ✓ Only own products | Can see status |
| Quick price | ✓ Only own products | N/A |

---

## Verification Checklist

- [ ] Users see "Your Listings" section only if they have products
- [ ] Edit/Delete buttons hidden for non-owners
- [ ] Quick Price button hidden for non-owners
- [ ] Stock Toggle button hidden for non-owners
- [ ] Buy Now button visible only for non-own products
- [ ] Buy Now button disabled if product out of stock
- [ ] Order modal shows correct product details
- [ ] Order object has all required fields (25+)
- [ ] Order ID format: "KD-" + 6 digits
- [ ] Confirmation modal displays order details
- [ ] Bilingual text appears correctly
- [ ] RTL text direction works for Urdu
- [ ] No permission errors when managing own products
- [ ] Permission denied when trying to manage others' products

---

## Notes

- **Order ID Generation:** Uses random 6-digit number (100000-999999)
- **Seller Notification:** Currently logs to console; implement actual notification system
- **Database Persistence:** Orders are created in memory; implement Firebase/Firestore save
- **Payment Processing:** UI captures method; actual payment integration needed
- **Seller Details:** Currently stored in product object; consider separate seller profile

---

## Future Enhancements

1. Implement actual order persistence to Firestore
2. Add seller notification system (email, SMS, push)
3. Implement payment gateway integration
4. Add order tracking dashboard
5. Implement seller rating/review system
6. Add automatic order status updates
7. Implement order cancellation flow
8. Add delivery tracking
9. Implement dispute resolution system
