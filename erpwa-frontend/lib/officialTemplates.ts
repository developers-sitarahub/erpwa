export const OFFICIAL_TEMPLATES = [
    // --- MARKETING: Welcome & Onboarding (1-10) ---
    {
        id: "mkt_welcome_1",
        title: "Welcome Greeting",
        category: "MARKETING",
        body: "Hello {{1}}! Welcome to {{2}}. We're excited to have you with us. Explore our latest collection here: {{3}} today.",
        headerType: "TEXT",
        headerText: "Welcome aboard!",
        footerText: "Reply STOP to unsubscribe",
        buttons: [{ type: "URL", text: "Visit Website", value: "https://example.com" }]
    },
    {
        id: "mkt_welcome_2",
        title: "New Member Discount",
        category: "MARKETING",
        body: "Hi {{1}}, thanks for joining! As a welcome gift, use code {{2}} for {{3}}% off your first order. Shop now: {{4}} today.",
        headerType: "IMAGE",
        footerText: "Valid for 7 days only.",
        buttons: [{ type: "URL", text: "Claim Discount", value: "https://example.com/shop" }]
    },
    {
        id: "mkt_welcome_3",
        title: "Brand Introduction",
        category: "MARKETING",
        body: "Hi {{1}}! Discover what makes {{2}} unique. We're dedicated to {{3}}. Watch our story: {{4}} today.",
        headerType: "VIDEO",
        buttons: [{ type: "URL", text: "Watch Video", value: "https://example.com/about" }]
    },
    {
        id: "mkt_welcome_4",
        title: "App Download Invite",
        category: "MARKETING",
        body: "Get the best of {{1}} on your phone! Download our app today and get {{2}}. Link: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Download Now", value: "https://example.com/app" }]
    },
    {
        id: "mkt_welcome_5",
        title: "Social Media Join",
        category: "MARKETING",
        body: "Stay updated! Follow us on social media for daily tips on {{1}}. Join our community: {{2}} today.",
        headerType: "TEXT",
        headerText: "Let's get social!",
        buttons: [{ type: "URL", text: "Follow Us", value: "https://instagram.com/brand" }]
    },
    {
        id: "mkt_welcome_6",
        title: "Vip Program Intro",
        category: "MARKETING",
        body: "Hi {{1}}, you're invited to {{2}} VIP! Enjoy exclusive perks like {{3}}. Learn more: {{4}} today.",
        headerType: "IMAGE",
        footerText: "Exclusive invite for you.",
        buttons: [{ type: "URL", text: "Join VIP", value: "https://example.com/vip" }]
    },
    {
        id: "mkt_welcome_7",
        title: "Personalized Style Quiz",
        category: "MARKETING",
        body: "Find your perfect match, {{1}}! Take our 1-min quiz and get personalized {{2}} recommendations. Quiz: {{3}} today.",
        headerType: "TEXT",
        headerText: "What's your style?",
        buttons: [{ type: "URL", text: "Take Quiz", value: "https://example.com/quiz" }]
    },
    {
        id: "mkt_welcome_8",
        title: "First Order Surprise",
        category: "MARKETING",
        body: "Hi {{1}}, we have a surprise for you! Complete your first order today and get a free {{2}}. Claim here: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Shop & Claim", value: "https://example.com/offers" }]
    },
    {
        id: "mkt_welcome_9",
        title: "Meet the Founder",
        category: "MARKETING",
        body: "A message from our founder: 'We started {{1}} with one goal: {{2}}'. Read more about our journey: {{3}} today.",
        headerType: "TEXT",
        headerText: "Our Story",
        buttons: [{ type: "URL", text: "Read More", value: "https://example.com/story" }]
    },
    {
        id: "mkt_welcome_10",
        title: "Service Overview",
        category: "MARKETING",
        body: "Welcome to {{1}}! Here's how we can help you: 1. {{2}} 2. {{3}} 3. {{4}}. Book a demo: {{5}} today.",
        headerType: "TEXT",
        headerText: "How it works",
        buttons: [{ type: "URL", text: "Book Demo", value: "https://example.com/demo" }]
    },

    // --- MARKETING: Sales & Promotions (11-30) ---
    {
        id: "mkt_sale_1",
        title: "Flash Sale Alert",
        category: "MARKETING",
        body: "FLASH SALE ⚡️ Get {{1}}% OFF on all {{2}} items for the next {{3}} hours! Shop the sale: {{4}} today.",
        headerType: "IMAGE",
        footerText: "Hurry, stocks limited!",
        buttons: [{ type: "URL", text: "Shop Sale", value: "https://example.com/sale" }]
    },
    {
        id: "mkt_sale_2",
        title: "Holiday Mega Sale",
        category: "MARKETING",
        body: "Celebrate {{1}} with up to {{2}}% off! Plus, get {{3}} on orders above {{4}}. Browse deals: {{5}} today.",
        headerType: "IMAGE",
        headerText: "Holiday Special 🎁",
        buttons: [{ type: "URL", text: "Browse Deals", value: "https://example.com/holiday" }]
    },
    {
        id: "mkt_sale_3",
        title: "Abandoned Cart Recovery",
        category: "MARKETING",
        body: "Did you forget something, {{1}}? Your items are waiting! Use code {{2}} for free shipping. Finish checkout: {{3}} today.",
        headerType: "IMAGE",
        footerText: "Items held for a limited time.",
        buttons: [{ type: "URL", text: "Complete Order", value: "https://example.com/cart" }]
    },
    {
        id: "mkt_sale_4",
        title: "Buy 1 Get 1 Free",
        category: "MARKETING",
        body: "BOGO ALERT! Buy any {{1}} and get {{2}} FREE. Limited time only. Shop now: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Shop BOGO", value: "https://example.com/bogo" }]
    },
    {
        id: "mkt_sale_5",
        title: "Early Access Sale",
        category: "MARKETING",
        body: "Exclusive for {{1}} members! Get 24-hour early access to our {{2}} sale. Shop before everyone else: {{3}} today.",
        headerType: "TEXT",
        headerText: "Member Exclusive 🤫",
        buttons: [{ type: "URL", text: "Get Early Access", value: "https://example.com/exclusive" }]
    },
    {
        id: "mkt_sale_6",
        title: "Clearance Stock Out",
        category: "MARKETING",
        body: "FINAL CLEARANCE! Everything must go. Prices slashed by up to {{1}}%. Check styles: {{2}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Shop Clearance", value: "https://example.com/clearance" }]
    },
    {
        id: "mkt_sale_7",
        title: "Weekend Special Offer",
        category: "MARKETING",
        body: "Weekend vibes! Get a flat {{1}} off on your order of {{2}} or more this Sat-Sun. Shop here: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Shop Weekend", value: "https://example.com/weekend" }]
    },
    {
        id: "mkt_sale_8",
        title: "Upsell Offer",
        category: "MARKETING",
        body: "Since you loved {{1}}, we think you'll adore {{2}}. Get it now for {{3}}% off! Add to collection: {{4}} today.",
        headerType: "IMAGE",
        footerText: "Selected just for you.",
        buttons: [{ type: "URL", text: "Buy Now", value: "https://example.com/p/123" }]
    },
    {
        id: "mkt_sale_9",
        title: "Refer a Friend Promo",
        category: "MARKETING",
        body: "Share the love! Refer a friend and you both get {{1}}% off your next order. Your referral link: {{2}} today.",
        headerType: "TEXT",
        headerText: "Win-Win! 💝",
        buttons: [{ type: "URL", text: "Invite Friends", value: "https://example.com/refer" }]
    },
    {
        id: "mkt_sale_10",
        title: "Birthday Treat",
        category: "MARKETING",
        body: "Happy Birthday, {{1}}! 🎉 Enjoy a special {{2}}% discount on us. Use code {{3}} at checkout. Shop your treat: {{4}} today.",
        headerType: "IMAGE",
        footerText: "Valid during your birthday month.",
        buttons: [{ type: "URL", text: "Happy Shopping", value: "https://example.com/bday" }]
    },
    {
        id: "mkt_sale_11",
        title: "New Product Launch",
        category: "MARKETING",
        body: "IT'S HERE! Meet the new {{1}}. Designed for {{2}}. Be the first to own it: {{3}} today.",
        headerType: "VIDEO",
        buttons: [{ type: "URL", text: "View Product", value: "https://example.com/new" }]
    },
    {
        id: "mkt_sale_12",
        title: "Pre-Order Opening",
        category: "MARKETING",
        body: "Pre-orders for {{1}} are now OPEN! Secure yours today and get a bonus {{2}}. Pre-order here: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Pre-order Now", value: "https://example.com/preorder" }]
    },
    {
        id: "mkt_sale_13",
        title: "Back in Stock Notify",
        category: "MARKETING",
        body: "Good news! {{1}} is back in stock. It sold out fast last time, so grab yours before it's gone. Buy now: {{2}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Grab Yours", value: "https://example.com/stock" }]
    },
    {
        id: "mkt_sale_14",
        title: "Loyalty Points Update",
        category: "MARKETING",
        body: "You have {{1}} loyalty points! Redeem them for a {{2}}% discount or a free {{3}}. Redeem now: {{4}} today.",
        headerType: "TEXT",
        headerText: "Your Rewards 🌟",
        buttons: [{ type: "URL", text: "Redeem Points", value: "https://example.com/rewards" }]
    },
    {
        id: "mkt_sale_15",
        title: "Seasonal Gift Guide",
        category: "MARKETING",
        body: "Struggling with gifts for {{1}}? Check out our curated {{2}} gift guide for ideas starting at {{3}}. View guide: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "View Guide", value: "https://example.com/guide" }]
    },
    {
        id: "mkt_sale_16",
        title: "Limited Edition Release",
        category: "MARKETING",
        body: "Introducing the Limited Edition {{1}}. Only {{2}} pieces available globally. Get yours while you can: {{3}} today.",
        headerType: "IMAGE",
        footerText: "Once it's gone, it's gone.",
        buttons: [{ type: "URL", text: "Shop Limited", value: "https://example.com/limited" }]
    },
    {
        id: "mkt_sale_17",
        title: "bundle & Save",
        category: "MARKETING",
        body: "Save more with bundles! Buy the {{1}} bundle and save {{2}}% compared to individual items. Shop bundles: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Shop Bundles", value: "https://example.com/bundles" }]
    },
    {
        id: "mkt_sale_18",
        title: "End of Season Sale",
        category: "MARKETING",
        body: "The {{1}} Season Sale is drawing to a close! Last chance to grab up to {{2}}% off. Shop final markdowns: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Final Markdowns", value: "https://example.com/sale" }]
    },
    {
        id: "mkt_sale_19",
        title: "App Exclusive Promo",
        category: "MARKETING",
        body: "App users only! Use code {{1}} in the app for an extra {{2}}% off today. Open App: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Open App", value: "https://example.com/app" }]
    },
    {
        id: "mkt_sale_20",
        title: "Free Gift with Purchase",
        category: "MARKETING",
        body: "Get a free {{1}} on all orders above {{2}}! Valid today only. Shop now: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Shop for Gift", value: "https://example.com/shop" }]
    },

    // --- MARKETING: Re-engagement (31-50) ---
    {
        id: "mkt_re_1",
        title: "We Miss You Offer",
        category: "MARKETING",
        body: "It's been a while, {{1}}! We miss having you around. Here's {{2}}% off to welcome you back. Shop now: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Come Back & Save", value: "https://example.com/back" }]
    },
    {
        id: "mkt_re_2",
        title: "Win Back Coupon",
        category: "MARKETING",
        body: "Hi {{1}}, we'd love to see you again! Use code {{2}} for a flat {{3}} off your next purchase. See what's new: {{4}} today.",
        headerType: "TEXT",
        headerText: "For you! 🎁",
        buttons: [{ type: "URL", text: "Use Coupon", value: "https://example.com/new" }]
    },
    {
        id: "mkt_re_3",
        title: "Feedback Request",
        category: "MARKETING",
        body: "Hi {{1}}, missing you at {{2}}! How can we improve? Share your thoughts and get a {{3}} voucher: {{4}} today.",
        headerType: "TEXT",
        headerText: "We value you",
        buttons: [{ type: "URL", text: "Take Survey", value: "https://example.com/survey" }]
    },
    {
        id: "mkt_re_4",
        title: "New Collections for You",
        category: "MARKETING",
        body: "Hi {{1}}! We've added lots of new {{2}} since your last visit. Here's a peek at what you might like: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "See New Arrivals", value: "https://example.com/arrivals" }]
    },
    {
        id: "mkt_re_5",
        title: "Account Dormancy Warning",
        category: "MARKETING",
        body: "Hi {{1}}, your account at {{2}} has been inactive. Log in today to keep your reward points: {{3}} today.",
        headerType: "TEXT",
        headerText: "Action Required",
        buttons: [{ type: "URL", text: "Log In", value: "https://example.com/login" }]
    },
    {
        id: "mkt_re_6",
        title: "Price Drop Notification",
        category: "MARKETING",
        body: "Good news, {{1}}! The price of {{2}} has dropped to {{3}}. Grab it before the price goes back up! Buy: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Buy at New Price", value: "https://example.com/p/1" }]
    },
    {
        id: "mkt_re_7",
        title: "Social Proof Update",
        category: "MARKETING",
        body: "Hi {{1}}! Thousands are loving our new {{2}}. See why it's a best-seller: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "See Reviews", value: "https://example.com/reviews" }]
    },
    {
        id: "mkt_re_8",
        title: "Abandoned Browser Recovery",
        category: "MARKETING",
        body: "Hi {{1}}, saw you looking at {{2}}! Want to know more? Chat with our expert or shop now: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "View Product", value: "https://example.com/p/2" }]
    },
    {
        id: "mkt_re_9",
        title: "Loyalty Tier Re-engagement",
        category: "MARKETING",
        body: "Hi {{1}}, you're just {{2}} orders away from {{3}} status! Enjoy perks like free delivery and {{4}}. Order now: {{5}} today.",
        headerType: "TEXT",
        headerText: "Level Up! 🚀",
        buttons: [{ type: "URL", text: "Shop Now", value: "https://example.com/shop" }]
    },
    {
        id: "mkt_re_10",
        title: "Personal Portfolio Review",
        category: "MARKETING",
        body: "Hi {{1}}, it's been a while! Should we review your {{2}} strategy together? Book a quick catch-up: {{3}} today.",
        headerType: "TEXT",
        headerText: "Catch up? 👋",
        buttons: [{ type: "URL", text: "Book Slot", value: "https://example.com/calendar" }]
    },
    {
        id: "mkt_re_11",
        title: "Exclusive Content Update",
        category: "MARKETING",
        body: "Hi {{1}}! We just released a new guide on '{{2}}'. Since you're interested in {{3}}, we thought you'd like it: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Read Guide", value: "https://example.com/blog" }]
    },
    {
        id: "mkt_re_12",
        title: "Mystery Gift Reveal",
        category: "MARKETING",
        body: "We have a mystery gift for you, {{1}}! 🎁 To reveal what's inside, click the link and log in: {{2}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Reveal Gift", value: "https://example.com/mystery" }]
    },
    {
        id: "mkt_re_13",
        title: "Event Invitation",
        category: "MARKETING",
        body: "You're invited! Join our webinar on {{1}} at {{2}}. Learn how to {{3}}. RSVP here: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "RSVP Now", value: "https://example.com/rsvp" }]
    },
    {
        id: "mkt_re_14",
        title: "Community Milestone",
        category: "MARKETING",
        body: "We hit {{1}} members! 🎉 To celebrate, every order today gets {{2}}. Thanks for being part of {{3}}! Shop: {{4}} today.",
        headerType: "TEXT",
        headerText: "Celebration! 🥳",
        buttons: [{ type: "URL", text: "Shop Sale", value: "https://example.com/sale" }]
    },
    {
        id: "mkt_re_15",
        title: "User Anniversary",
        category: "MARKETING",
        body: "Happy 1-year anniversary with {{1}}! 🥂 It's been a great journey. Here's a gift of {{2}} points for you: {{3}} today.",
        headerType: "TEXT",
        headerText: "Cheers to you!",
        buttons: [{ type: "URL", text: "Claim Points", value: "https://example.com/anniversary" }]
    },
    {
        id: "mkt_re_16",
        title: "Subscription Renewal Hint",
        category: "MARKETING",
        body: "Hi {{1}}, your {{2}} subscription is ending soon. Renew today and get {{3}} months free! Link: {{4}} today.",
        headerType: "TEXT",
        headerText: "Don't lose access!",
        buttons: [{ type: "URL", text: "Renew Now", value: "https://example.com/renew" }]
    },
    {
        id: "mkt_re_17",
        title: "Referral Reminder",
        category: "MARKETING",
        body: "Hey {{1}}, don't forget you can earn {{2}} for every friend who joins {{3}}! Start sharing now: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Share Now", value: "https://example.com/refer" }]
    },
    {
        id: "mkt_re_18",
        title: "Service Upgrade Offer",
        category: "MARKETING",
        body: "Hi {{1}}, ready to take {{2}} to the next level? Upgrade to {{3}} today and get {{4}}% off for life! Upgrade: {{5}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Upgrade Plan", value: "https://example.com/upgrade" }]
    },
    {
        id: "mkt_re_19",
        title: "Local Store Opening",
        category: "MARKETING",
        body: "Exciting news, {{1}}! We're opening a new store in {{2}} on {{3}}. Come visit and get {{4}}! Directions: {{5}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Get Directions", value: "https://maps.app/123" }]
    },
    {
        id: "mkt_re_20",
        title: "Personalized Catalog",
        category: "MARKETING",
        body: "Hi {{1}}, we've created a personalized catalog of {{2}} products based on your style! Check it out: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "View Catalog", value: "https://example.com/catalog" }]
    },

    // --- UTILITY: Order & Payment (51-70) ---
    {
        id: "ut_order_1",
        title: "Order Confirmation",
        category: "UTILITY",
        body: "Hi {{1}}, your order #{{2}} for {{3}} has been received! We'll notify you once it's shipped. Track order: {{4}} today.",
        headerType: "TEXT",
        headerText: "Order Received ✅",
        buttons: [{ type: "URL", text: "Track Order", value: "https://example.com/track/{{2}}" }]
    },
    {
        id: "ut_order_2",
        title: "Order Shipped",
        category: "UTILITY",
        body: "Great news! Your order #{{1}} is on its way. Expect delivery by {{2}}. Track live: {{3}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Track Delivery", value: "https://shipping.com/{{1}}" }]
    },
    {
        id: "ut_order_3",
        title: "Deliver Status Update",
        category: "UTILITY",
        body: "Your package #{{1}} is out for delivery today! Our partner will reach you at {{2}}. Track: {{3}} today.",
        headerType: "TEXT",
        headerText: "Out For Delivery 🚚",
        buttons: [{ type: "URL", text: "Track Driver", value: "https://track.com/{{1}}" }]
    },
    {
        id: "ut_order_4",
        title: "Order Delivered",
        category: "UTILITY",
        body: "Hooray! Your order #{{1}} has been delivered. Enjoy your purchase! How was your experience? Rate us: {{2}} today.",
        headerType: "TEXT",
        headerText: "Delivered 🎉",
        buttons: [{ type: "URL", text: "Rate App", value: "https://example.com/rate" }]
    },
    {
        id: "ut_order_5",
        title: "Order Cancelled",
        category: "UTILITY",
        body: "Hi {{1}}, your order #{{2}} has been cancelled as requested. Any refund will be processed in {{3}} days. Details: {{4}} today.",
        headerType: "TEXT",
        headerText: "Order Cancelled",
        buttons: [{ type: "URL", text: "View Details", value: "https://example.com/orders" }]
    },
    {
        id: "ut_pay_1",
        title: "Payment Received",
        category: "UTILITY",
        body: "Payment of {{1}} for invoice {{2}} was successful. Thank you! Download receipt: {{3}} today.",
        headerType: "TEXT",
        headerText: "Payment Success 💰",
        buttons: [{ type: "URL", text: "Get Receipt", value: "https://example.com/receipt/{{2}}" }]
    },
    {
        id: "ut_pay_2",
        title: "Payment Reminder",
        category: "UTILITY",
        body: "Hi {{1}}, a quick reminder that your payment of {{2}} for {{3}} is due on {{4}}. Pay now to avoid late fees: {{5}} today.",
        headerType: "TEXT",
        headerText: "Payment Due Soon",
        buttons: [{ type: "URL", text: "Pay Now", value: "https://example.com/pay" }]
    },
    {
        id: "ut_pay_3",
        title: "Payment Failed",
        category: "UTILITY",
        body: "Alert: Payment for your {{1}} subscription failed. Please update your payment method to continue: {{2}} today.",
        headerType: "TEXT",
        headerText: "Payment Failed ⚠️",
        buttons: [{ type: "URL", text: "Update Billing", value: "https://example.com/billing" }]
    },
    {
        id: "ut_pay_4",
        title: "Refund Processed",
        category: "UTILITY",
        body: "Good news! We've processed your refund of {{1}} for order #{{2}}. It should appear in your account within {{3}} days.",
        headerType: "TEXT",
        headerText: "Refund Success",
    },
    {
        id: "ut_pay_5",
        title: "In-Store Pickup Ready",
        category: "UTILITY",
        body: "Hi {{1}}, your order #{{2}} is ready for pickup at our {{3}} store! Please bring this message and a valid ID.",
        headerType: "TEXT",
        headerText: "Ready for Pickup 📦",
        buttons: [{ type: "URL", text: "Get Directions", value: "https://maps.app/123" }]
    },
    {
        id: "ut_order_6",
        title: "Delay Notification",
        category: "UTILITY",
        body: "We apologize! Your order #{{1}} is delayed due to {{2}}. New estimated delivery: {{3}}. View status: {{4}} today.",
        headerType: "TEXT",
        headerText: "Shipping Update",
        buttons: [{ type: "URL", text: "Check Status", value: "https://example.com/status" }]
    },
    {
        id: "ut_order_7",
        title: "Return Request Received",
        category: "UTILITY",
        body: "Hi {{1}}, we've received your return request for #{{2}}. Our courier will pick it up on {{3}}. Prepare your pack.",
        headerType: "TEXT",
        headerText: "Return Received",
    },
    {
        id: "ut_order_8",
        title: "Return Quality Check",
        category: "UTILITY",
        body: "Update: Quality check for return #{{1}} is complete. We've initiated your refund/replacement. Details: {{2}} today.",
        headerType: "TEXT",
        headerText: "Return Approved",
    },
    {
        id: "ut_order_9",
        title: "Exchange Confirmed",
        category: "UTILITY",
        body: "Hi {{1}}, your exchange for {{2}} is confirmed. New order #{{3}} is being processed. Link: {{4}} today.",
        headerType: "TEXT",
        headerText: "Exchange Success",
    },
    {
        id: "ut_pay_6",
        title: "E-Wallet Added Cash",
        category: "UTILITY",
        body: "Success! {{1}} has been added to your {{2}} wallet. Your new balance is {{3}}. View history: {{4}} today.",
        headerType: "TEXT",
        headerText: "Wallet Updated",
        buttons: [{ type: "URL", text: "Check Balance", value: "https://example.com/wallet" }]
    },
    {
        id: "ut_pay_7",
        title: "Low Balance Alert",
        category: "UTILITY",
        body: "Hi {{1}}, your wallet balance is low ({{2}}). Please top up to avoid service interruption: {{3}} today.",
        headerType: "TEXT",
        headerText: "Top Up Now",
        buttons: [{ type: "URL", text: "Add Funds", value: "https://example.com/topup" }]
    },
    {
        id: "ut_order_10",
        title: "Gift Card Delivered",
        category: "UTILITY",
        body: "Hi {{1}}, you've received a gift card from {{2}}! Code: {{3}}. Value: {{4}}. Redeem: {{5}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Redeem Gift", value: "https://example.com/redeem" }]
    },
    {
        id: "ut_order_11",
        title: "Pre-order Reservation",
        category: "UTILITY",
        body: "Successfully reserved! We've held a {{1}} for you. We'll alert you to pay once ready on {{2}} now.",
        headerType: "TEXT",
        headerText: "Reservation OK",
    },
    {
        id: "ut_pay_8",
        title: "Subscription Renewal",
        category: "UTILITY",
        body: "Your {{1}} plan was renewed! Next billing will be on {{2}}. Thanks for choosing us. Manage: {{3}} today.",
        headerType: "TEXT",
        headerText: "Renewal Success",
        buttons: [{ type: "URL", text: "Manage Plan", value: "https://example.com/plans" }]
    },
    {
        id: "ut_pay_9",
        title: "Address Verification",
        category: "UTILITY",
        body: "Hi {{1}}, we're having trouble with your delivery address for #{{2}}. Please verify it here: {{3}} today.",
        headerType: "TEXT",
        headerText: "Verify Address",
        buttons: [{ type: "URL", text: "Fix Address", value: "https://example.com/address" }]
    },

    // --- UTILITY: Appointments & Services (71-85) ---
    {
        id: "ut_app_1",
        title: "Appt Confirmation",
        category: "UTILITY",
        body: "Hi {{1}}, your appointment for {{2}} is confirmed for {{3}} at {{4}}. See you then!",
        headerType: "TEXT",
        headerText: "Booking Success 📅",
        buttons: [{ type: "URL", text: "Add to Calendar", value: "https://example.com/cal" }]
    },
    {
        id: "ut_app_2",
        title: "Appt Reminder",
        category: "UTILITY",
        body: "Quick reminder, {{1}}! Your appointment at {{2}} is tomorrow at {{3}}. Need to reschedule? Click here: {{4}} today.",
        headerType: "TEXT",
        headerText: "Reminder: Tomorrow",
        buttons: [{ type: "URL", text: "Reschedule", value: "https://example.com/change" }]
    },
    {
        id: "ut_app_3",
        title: "Appt Rescheduled",
        category: "UTILITY",
        body: "Got it, {{1}}! Your appointment has been moved to {{2}} at {{3}}. Confirm details: {{4}} today.",
        headerType: "TEXT",
        headerText: "Time Updated",
    },
    {
        id: "ut_app_4",
        title: "Waitlist Alert",
        category: "UTILITY",
        body: "Good news, {{1}}! A spot just opened up for {{2}} on {{3}} at {{4}}. Book it now: {{5}} today.",
        headerType: "TEXT",
        headerText: "Slot Available!",
        buttons: [{ type: "URL", text: "Book Slot", value: "https://example.com/book/{{1}}" }]
    },
    {
        id: "ut_app_5",
        title: "Appt Follow-up",
        category: "UTILITY",
        body: "Hi {{1}}, thanks for visiting us today! Hope you had a great experience. Share your feedback: {{2}} today.",
        headerType: "TEXT",
        headerText: "How was it?",
        buttons: [{ type: "URL", text: "Give Review", value: "https://example.com/review" }]
    },
    {
        id: "ut_svc_1",
        title: "Service Completed",
        category: "UTILITY",
        body: "Your {{1}} service (Job #{{2}}) is complete! Total amount: {{3}}. View report: {{4}} today.",
        headerType: "TEXT",
        headerText: "Service Done ✅",
        buttons: [{ type: "URL", text: "View Report", value: "https://example.com/rep/{{2}}" }]
    },
    {
        id: "ut_svc_2",
        title: "Technician En-route",
        category: "UTILITY",
        body: "Hi {{1}}, our technician {{2}} is on the way to your location for {{3}}. Est. arrival: {{4}} now.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Track Tech", value: "https://track.com/tech" }]
    },
    {
        id: "ut_svc_3",
        title: "Membership Activation",
        category: "UTILITY",
        body: "Welcome! Your {{1}} membership is now ACTIVE. Enjoy your benefits! Log in here: {{2}} today.",
        headerType: "TEXT",
        headerText: "Welcome Member",
    },
    {
        id: "ut_svc_4",
        title: "Support Ticket Update",
        category: "UTILITY",
        body: "Hi {{1}}, your support ticket #{{2}} has an update: '{{3}}'. View response: {{4}} today.",
        headerType: "TEXT",
        headerText: "Ticket Update 🛠️",
        buttons: [{ type: "URL", text: "View Ticket", value: "https://help.com/{{2}}" }]
    },
    {
        id: "ut_svc_5",
        title: "Quote Received",
        category: "UTILITY",
        body: "Hi {{1}}, here is your requested quote for {{2}}: {{3}}. Ready to proceed? Book now: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Approve Quote", value: "https://example.com/quote" }]
    },
    {
        id: "ut_app_6",
        title: "Demo Confirmation",
        category: "UTILITY",
        body: "Hi {{1}}, your demo for {{2}} is scheduled for {{3}}. Join link: {{4}}. See you soon!",
        headerType: "TEXT",
        headerText: "Demo Booked",
        buttons: [{ type: "URL", text: "Join Meeting", value: "https://meet.inc/{{1}}" }]
    },
    {
        id: "ut_app_7",
        title: "Seminar Invite",
        category: "UTILITY",
        body: "You're registered for {{1}}! It starts on {{2}} at {{3}}. Access details: {{4}} today.",
        headerType: "IMAGE",
        buttons: [{ type: "URL", text: "Get Access", value: "https://event.com/{{1}}" }]
    },
    {
        id: "ut_svc_6",
        title: "License Renewed",
        category: "UTILITY",
        body: "Success! Your license for {{1}} has been renewed until {{2}}. Download key: {{3}} today.",
        headerType: "TEXT",
        headerText: "License OK",
    },
    {
        id: "ut_svc_7",
        title: "System Maintenance",
        category: "UTILITY",
        body: "Notice: {{1}} will undergo maintenance on {{2}} at {{3}}. Expected downtime: {{4}} hours.",
        headerType: "TEXT",
        headerText: "Maintenance Alert",
    },
    {
        id: "ut_svc_8",
        title: "Account Security Alert",
        category: "UTILITY",
        body: "Security Alert: A new login was detected on your account from {{1}}. If this was you, ignore. If not, secure: {{2}} today.",
        headerType: "TEXT",
        headerText: "Security Notice 🛡️",
        buttons: [{ type: "URL", text: "Secure Account", value: "https://example.com/secure" }]
    },

    // --- AUTHENTICATION: OTPs & Access (86-105) ---
    {
        id: "auth_otp_1",
        title: "General OTP",
        category: "AUTHENTICATION",
        body: "Your verification code is {{1}}. Valid for {{2}} minutes. Do not share with anyone.",
        headerType: "TEXT",
        headerText: "Verification Code",
        buttons: [{ type: "URL", text: "Verify Now", value: "https://example.com/verify?code={{1}}" }]
    },
    {
        id: "auth_otp_2",
        title: "Login OTP",
        category: "AUTHENTICATION",
        body: "Hi {{1}}, your OTP for login to {{2}} is {{3}}. For your security, this code expires in {{4}} min.",
        headerType: "TEXT",
        headerText: "Login Secure",
    },
    {
        id: "auth_otp_3",
        title: "Registration OTP",
        category: "AUTHENTICATION",
        body: "Welcome to {{1}}! Use code {{2}} to complete your registration. Valid for {{3}} mins.",
        headerType: "TEXT",
        headerText: "Registration",
    },
    {
        id: "auth_otp_4",
        title: "Transaction OTP",
        category: "AUTHENTICATION",
        body: "Alert: Use OTP {{1}} to authorize your transaction of {{2}} at {{3}}. Never share this OTP.",
        headerType: "TEXT",
        headerText: "Verify Payment",
    },
    {
        id: "auth_otp_5",
        title: "Reset Password OTP",
        category: "AUTHENTICATION",
        body: "Password recovery: Your code is {{1}}. Valid for {{2}} minutes. Enter it to set a new password.",
        headerType: "TEXT",
        headerText: "Reset Password",
    },
    {
        id: "auth_otp_6",
        title: "Device Linking OTP",
        category: "AUTHENTICATION",
        body: "Link your new device '{{1}}' to {{2}} using OTP {{3}}. Valid for {{4}} min.",
        headerType: "TEXT",
        headerText: "Link Device",
    },
    {
        id: "auth_otp_7",
        title: "Phone Verification",
        category: "AUTHENTICATION",
        body: "Verify your phone number on {{1}} with code {{2}}. Valid for {{3}} min.",
        headerType: "TEXT",
        headerText: "Verify Phone",
    },
    {
        id: "auth_otp_8",
        title: "Email Change OTP",
        category: "AUTHENTICATION",
        body: "Requested email change? Use code {{1}} to verify. If not you, contact us immediately.",
        headerType: "TEXT",
        headerText: "Email Change",
    },
    {
        id: "auth_otp_9",
        title: "Withdrawal OTP",
        category: "AUTHENTICATION",
        body: "Auth: Use code {{1}} to confirm withdrawal of {{2}} from your wallet. Valid for {{3}} min.",
        headerType: "TEXT",
        headerText: "Verify Withdrawal",
    },
    {
        id: "auth_otp_10",
        title: "KYC Verification OTP",
        category: "AUTHENTICATION",
        body: "KYC Auth: Your secret code is {{1}}. Use it to complete your ID verification at {{2}} now.",
        headerType: "TEXT",
        headerText: "KYC Verify",
    },
    {
        id: "auth_link_1",
        title: "Magic Link Login",
        category: "AUTHENTICATION",
        body: "Hi {{1}}, click the link below to sign in instantly to {{2}}. Link valid for {{3}} hours: {{4}} today.",
        headerType: "TEXT",
        headerText: "Sign in Link",
        buttons: [{ type: "URL", text: "Magic Login", value: "{{4}}" }]
    },
    {
        id: "auth_link_2",
        title: "Account Activation Link",
        category: "AUTHENTICATION",
        body: "Welcome to {{1}}! Activate your account by clicking here: {{2}}. We're glad to have you!",
        headerType: "TEXT",
        headerText: "Activate Now",
        buttons: [{ type: "URL", text: "Activate", value: "{{2}}" }]
    },
    {
        id: "auth_link_3",
        title: "Secure Logout Link",
        category: "AUTHENTICATION",
        body: "Hi {{1}}, logout from all other devices by clicking here: {{2}}. Recommended for your security.",
        headerType: "TEXT",
        headerText: "Global Logout",
        buttons: [{ type: "URL", text: "Logout All", value: "https://example.com/logout-all" }]
    },
    {
        id: "auth_app_1",
        title: "2FA App Enable",
        category: "AUTHENTICATION",
        body: "Enable 2FA on {{1}} for extra security! Your setup code is {{2}}. Enter it in your Auth App.",
        headerType: "TEXT",
        headerText: "Security Boost",
    },
    {
        id: "auth_app_2",
        title: "Backup Codes",
        category: "AUTHENTICATION",
        body: "Hi {{1}}, here are your 2FA backup codes for {{2}}: {{3}}, {{4}}, {{5}}. Keep them safe.",
        headerType: "TEXT",
        headerText: "Backup Codes",
    },
    {
        id: "auth_sec_1",
        title: "Pin Reset Alert",
        category: "AUTHENTICATION",
        body: "Your PIN for {{1}} has been reset. If you didn't do this, call {{2}} immediately.",
        headerType: "TEXT",
        headerText: "PIN Changed",
    },
    {
        id: "auth_sec_2",
        title: "Social Login Link",
        category: "AUTHENTICATION",
        body: "Link your {{1}} account to {{2}} to enable easy login next time! Link: {{3}} today.",
        headerType: "TEXT",
        headerText: "Easy Login",
        buttons: [{ type: "URL", text: "Link Now", value: "{{3}}" }]
    },
    {
        id: "auth_otp_11",
        title: "Agent Verification",
        category: "AUTHENTICATION",
        body: "In-peron verify: The agent at your door is {{1}}. Your secret code to share with them is {{2}} now.",
        headerType: "TEXT",
        headerText: "Verify Agent",
    },
    {
        id: "auth_otp_12",
        title: "Booking Cancellation OTP",
        category: "AUTHENTICATION",
        body: "Confirm cancellation of booking #{{1}} with code {{2}}. Valid for {{3}} min.",
        headerType: "TEXT",
        headerText: "Cancel Verify",
    },
    {
        id: "auth_otp_13",
        title: "Admin Panel Access",
        category: "AUTHENTICATION",
        body: "Admin Login: Authenticate your entry to the Dashboard with code {{1}}. Valid for {{2}} min.",
        headerType: "TEXT",
        headerText: "Admin Secure",
    }
];
