# App Concept: Restaurant Booking

## Core Value

Enable users to discover and book restaurants through natural conversation, leveraging real-time availability data.

## Natural Prompts

What would users say to trigger this?

- "Find me a romantic Italian restaurant for tonight"
- "Book a table at Chez Pierre for 7pm, 4 people"
- "What's good near me for a quick lunch?"
- "Cancel my reservation at Bistro Moderne"
- "Change my booking to 8pm instead"

## Tools Needed

| Tool | Input | Output | Widget? |
|------|-------|--------|---------|
| `search_restaurants` | cuisine, location, date, party_size, price_range | List of restaurants | Yes - carousel |
| `get_restaurant_details` | restaurant_id | Full details, menu, photos | Yes - detail card |
| `book_table` | restaurant_id, date, time, party_size, name | Confirmation | Yes - confirmation |
| `cancel_booking` | booking_id | Success/failure | No |
| `modify_booking` | booking_id, new_time/date | Updated confirmation | Yes - confirmation |

## Conversational Flows

### Flow 1: Discovery + Booking

```
User: "Find me somewhere nice for dinner tonight, Italian food,
       somewhere with a good wine list"

Model: [Calls search_restaurants with filters]
       "I found 5 Italian restaurants with strong wine programs
        near you. Here are the top options:"

Widget: Carousel showing:
        - Restaurant name + photo
        - Rating + price level
        - Distance
        - "Available tonight" badge

User: [Clicks second option] or "Tell me more about Osteria Bella"

Model: [Calls get_restaurant_details]
       "Osteria Bella is a family-owned Tuscan restaurant..."

Widget: Detail card with:
        - Photo gallery
        - Menu highlights
        - Reviews summary
        - "Book Table" button

User: "Book it for 7:30, party of 2"

Model: [Calls book_table]
       "Done! Your table is confirmed."

Widget: Confirmation card with:
        - Restaurant name + address
        - Date, time, party size
        - Confirmation number
        - "Add to Calendar" | "Modify" buttons

Model: "Would you like directions, or should I save this to your calendar?"
```

### Flow 2: Direct Booking

```
User: "Book Chez Pierre for tonight at 7pm, 4 people"

Model: [Calls search for availability]
       "I found Chez Pierre has availability at 7pm.
        Should I book for 4 guests under your name?"

User: "Yes"

Model: [Calls book_table]

Widget: Confirmation card

Model: "All set! Anything else for tonight?"
```

### Flow 3: Modification

```
User: "Change my reservation at Osteria Bella to 8pm"

Model: [Calls modify_booking]
       "Updated! Your reservation is now at 8pm instead of 7:30."

Widget: Updated confirmation card
```

## Evaluation Scores

### Conversational Value: 5/5
- Natural to ask ChatGPT for restaurant recommendations
- Benefits from conversation ("more upscale", "closer to downtown")
- Context remembers preferences from earlier messages

### Unique Data: 5/5
- Real-time availability ChatGPT doesn't have
- Actual booking capability (action)
- Live pricing and wait times

### Atomic Actions: 4/5
- Search: 1 call
- Book: 1 call
- Discovery + Book: 2-3 calls (search, maybe details, then book)
- Could be 5/5 if "book the first one" works in one call

### UI Necessity: 5/5
- Photo comparison essential for restaurant selection
- Visual cards much better than text lists
- Location/map would enhance

### Task Completion: 5/5
- Complete booking happens in chat
- Confirmation provided immediately
- Calendar integration possible

**Total: 24/25** - Excellent candidate

## Widget Specifications

### Search Results Carousel

```
Display Mode: Inline Carousel
Cards: 3-5 restaurants

Each card:
├── Image (aspect ratio 16:9)
├── Name (heading-md)
├── Cuisine • Price • Distance (body-small, secondary)
├── Rating: ★★★★☆ (4.5)
├── Badge: "Available Tonight" (success)
└── CTA: "View Details"
```

### Confirmation Card

```
Display Mode: Inline Card

Card:
├── Header: "Reservation Confirmed" + checkmark
├── Restaurant Name (heading-lg)
├── Address (body-small, secondary)
├── Details Grid:
│   ├── Date: Thursday, Dec 19
│   ├── Time: 7:30 PM
│   └── Party: 4 guests
├── Confirmation: #ABC123
└── Actions:
    ├── "Add to Calendar" (primary)
    └── "Modify Reservation" (secondary)
```

## Risks/Questions

1. **No-show handling**: Should the app remind users before reservation?
2. **Cancellation policies**: Need to surface cancellation fees/deadlines
3. **Special requests**: How to handle "can we get the patio?" type requests
4. **Multiple locations**: Restaurant chains with multiple locations
5. **Wait times**: Should we show estimated wait for walk-ins?

## Expansion Ideas (v2)

- Photo menu browsing
- Split check calculations
- Review submission after visit
- Loyalty/rewards integration
- Group coordination ("send invites to these people")
