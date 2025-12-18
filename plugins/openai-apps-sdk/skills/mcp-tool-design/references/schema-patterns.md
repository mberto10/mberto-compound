# JSON Schema Patterns for MCP Tools

## Basic Types

### String with Constraints

```json
{
  "type": "string",
  "minLength": 1,
  "maxLength": 100,
  "pattern": "^[a-zA-Z0-9]+$",
  "description": "Alphanumeric identifier"
}
```

### Number with Range

```json
{
  "type": "number",
  "minimum": 0,
  "maximum": 1000,
  "description": "Price in dollars"
}
```

### Integer with Enum

```json
{
  "type": "integer",
  "enum": [10, 25, 50, 100],
  "default": 25,
  "description": "Page size"
}
```

### Boolean

```json
{
  "type": "boolean",
  "default": false,
  "description": "Include archived items"
}
```

## Array Types

### Array of Strings

```json
{
  "type": "array",
  "items": { "type": "string" },
  "minItems": 1,
  "maxItems": 10,
  "description": "Tags to filter by"
}
```

### Array of Objects

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "quantity": { "type": "integer", "minimum": 1 }
    },
    "required": ["id", "quantity"]
  },
  "description": "Items to add to cart"
}
```

### Unique Items

```json
{
  "type": "array",
  "items": { "type": "string" },
  "uniqueItems": true,
  "description": "Unique category IDs"
}
```

## Object Patterns

### Required vs Optional Fields

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" }
  },
  "required": ["name", "email"],
  "additionalProperties": false
}
```

### Nested Objects

```json
{
  "type": "object",
  "properties": {
    "shipping": {
      "type": "object",
      "properties": {
        "address": { "type": "string" },
        "city": { "type": "string" },
        "country": { "type": "string" }
      },
      "required": ["address", "city", "country"]
    }
  }
}
```

### Dynamic Keys (Map)

```json
{
  "type": "object",
  "additionalProperties": {
    "type": "number"
  },
  "description": "Product ID to quantity mapping"
}
```

## Conditional Schemas

### OneOf (Mutually Exclusive)

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "type": { "const": "email" },
        "address": { "type": "string", "format": "email" }
      },
      "required": ["type", "address"]
    },
    {
      "type": "object",
      "properties": {
        "type": { "const": "phone" },
        "number": { "type": "string" }
      },
      "required": ["type", "number"]
    }
  ]
}
```

### AnyOf (At Least One)

```json
{
  "anyOf": [
    { "properties": { "email": { "type": "string" } }, "required": ["email"] },
    { "properties": { "phone": { "type": "string" } }, "required": ["phone"] }
  ]
}
```

### If-Then-Else

```json
{
  "type": "object",
  "properties": {
    "method": { "enum": ["credit", "paypal"] },
    "cardNumber": { "type": "string" },
    "paypalEmail": { "type": "string" }
  },
  "if": {
    "properties": { "method": { "const": "credit" } }
  },
  "then": {
    "required": ["cardNumber"]
  },
  "else": {
    "required": ["paypalEmail"]
  }
}
```

## Format Validators

Common string formats:

```json
{
  "properties": {
    "email": { "type": "string", "format": "email" },
    "website": { "type": "string", "format": "uri" },
    "date": { "type": "string", "format": "date" },
    "datetime": { "type": "string", "format": "date-time" },
    "uuid": { "type": "string", "format": "uuid" },
    "ipv4": { "type": "string", "format": "ipv4" }
  }
}
```

## File Upload Schema

For Apps SDK file handling:

```json
{
  "type": "object",
  "properties": {
    "file": {
      "type": "object",
      "properties": {
        "download_url": {
          "type": "string",
          "format": "uri",
          "description": "Temporary URL to download the file"
        },
        "file_id": {
          "type": "string",
          "description": "Unique file identifier"
        }
      },
      "required": ["download_url", "file_id"]
    }
  },
  "required": ["file"]
}
```

## Search/Filter Pattern

Common pattern for search endpoints:

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Search query"
    },
    "filters": {
      "type": "object",
      "properties": {
        "category": { "type": "string" },
        "minPrice": { "type": "number", "minimum": 0 },
        "maxPrice": { "type": "number", "minimum": 0 },
        "inStock": { "type": "boolean" }
      }
    },
    "sort": {
      "type": "object",
      "properties": {
        "field": { "enum": ["price", "name", "date"] },
        "order": { "enum": ["asc", "desc"], "default": "asc" }
      }
    },
    "pagination": {
      "type": "object",
      "properties": {
        "page": { "type": "integer", "minimum": 1, "default": 1 },
        "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }
      }
    }
  },
  "required": ["query"]
}
```

## CRUD Operations Pattern

### Create

```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "description": { "type": "string" },
        "price": { "type": "number", "minimum": 0 }
      },
      "required": ["name", "price"]
    }
  },
  "required": ["data"]
}
```

### Read

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Resource ID" }
  },
  "required": ["id"]
}
```

### Update

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "data": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "price": { "type": "number", "minimum": 0 }
      },
      "minProperties": 1
    }
  },
  "required": ["id", "data"]
}
```

### Delete

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "confirm": { "type": "boolean", "const": true }
  },
  "required": ["id", "confirm"]
}
```

## Default Values

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "default": 10,
      "description": "Number of results (default: 10)"
    },
    "includeArchived": {
      "type": "boolean",
      "default": false,
      "description": "Include archived items (default: false)"
    }
  }
}
```

## Strict Mode

Apps SDK uses strict mode by default. Ensure schemas are complete:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  },
  "required": ["name"],
  "additionalProperties": false
}
```

## Best Practices

1. **Always include descriptions** - Help the model understand each field
2. **Set reasonable defaults** - Reduce required fields where possible
3. **Use constraints** - min/max, patterns, enums
4. **Avoid deep nesting** - Keep objects 2-3 levels deep
5. **Use `additionalProperties: false`** - Prevent unexpected fields
6. **Document formats** - Use format validators for emails, URLs, etc.
