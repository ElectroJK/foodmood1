# FoodMood API reference (cheat-sheet)

Base URL: `http://localhost:4000`

All authenticated endpoints require `Authorization: Bearer <jwt>`.

## Health
| Method | Path        | Auth | Notes                              |
|--------|-------------|------|------------------------------------|
| GET    | /health     | no   | Liveness check                     |

## Auth
| Method | Path                       | Auth | Body                                |
|--------|----------------------------|------|-------------------------------------|
| POST   | /api/auth/register         | no   | { name, email, password }           |
| POST   | /api/auth/login            | no   | { email, password }                 |
| GET    | /api/auth/me               | yes  | —                                   |
| POST   | /api/auth/logout           | yes  | —                                   |
| POST   | /api/auth/forgot-password  | no   | { email } (stubbed)                 |

## Inventory
| Method | Path                                 | Body                                                            |
|--------|--------------------------------------|-----------------------------------------------------------------|
| GET    | /api/inventory?status=active         | —                                                               |
| POST   | /api/inventory                       | { name, category, quantity, unit, price, expiryDate, ... }      |
| POST   | /api/inventory/batch                 | { items: [...] }                                                |
| PATCH  | /api/inventory/:id                   | partial of create body                                          |
| DELETE | /api/inventory/:id                   | —                                                               |
| POST   | /api/inventory/:id/consume           | — → updates user stats                                          |
| POST   | /api/inventory/:id/discard           | —                                                               |
| POST   | /api/inventory/:id/share             | — → updates user stats                                          |

## Recipes
| Method | Path                          | Body                                  |
|--------|-------------------------------|---------------------------------------|
| GET    | /api/recipes                  | —                                     |
| GET    | /api/recipes/:id              | —                                     |
| GET    | /api/recipes/recommend/me     | — (auth) — expiry-aware ranking       |
| POST   | /api/recipes/recommend        | { pantry?, limit? }                   |
| POST   | /api/recipes/:id/use          | — → consumes matching pantry items    |

## Scan
| Method | Path        | Body                  | Returns                                           |
|--------|-------------|-----------------------|---------------------------------------------------|
| POST   | /api/scan   | multipart, image=...  | { items: ScannedItem[], rawText, meanConfidence } |

## Community
| Method | Path                                  | Body                                      |
|--------|---------------------------------------|-------------------------------------------|
| GET    | /api/community?lat=&lng=&radius=      | —                                         |
| POST   | /api/community                        | { itemName, quantity, image?, lat, lng }  |
| POST   | /api/community/:id/claim              | —                                         |
| DELETE | /api/community/:id                    | —                                         |

## Stats
| Method | Path                            | Returns                                      |
|--------|---------------------------------|----------------------------------------------|
| GET    | /api/stats/me                   | { stats }                                    |
| GET    | /api/stats/analytics?weeks=12   | { stats, weekly[], categories[] }            |

## Notifications
| Method | Path                              |
|--------|-----------------------------------|
| GET    | /api/notifications                |
| POST   | /api/notifications/:id/read       |

## Common DTO shapes (aligned with frontend TS interfaces)
```ts
FoodItem      { id, name, category, quantity, unit, price, expiryDate, addedDate, image?, status? }
Recipe        { id, name, matchPercentage, cookingTime, servings, ingredients, instructions, image }
Community     { id, itemName, quantity, userName, image?, lat, lng, distance?, status? }
ScannedItem   { name, price, expiryDate, confidence }
UserStats     { foodSavedKg, co2Offset, moneySaved, wasteWarriorLevel }
```
