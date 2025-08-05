# Spatial Index Configuration

## Current Setup
The `locationPoint` column in `task_proofs` table is configured as nullable to handle cases where location data might not be available.

## Why No Spatial Index?
MySQL requires that all columns in a SPATIAL index must be NOT NULL. Since our `locationPoint` can be null, we cannot create a spatial index on it.

## Options

### Option 1: Keep Nullable (Current)
- Pros: Flexible, handles missing location data
- Cons: No spatial index optimization
- Query performance: Adequate for small-medium datasets

### Option 2: Make NOT NULL with Default
If you need spatial indexing for performance:

1. Update the model:
```typescript
@Column({
  type: 'point',
  spatialFeatureType: 'Point',
  srid: 4326,
  nullable: false,
  default: () => 'POINT(0 0)', // Default to 0,0
})
locationPoint: { x: number; y: number };
```

2. Add spatial index decorator:
```typescript
@Index({ spatial: true })
locationPoint: { x: number; y: number };
```

3. Update existing NULL records:
```sql
UPDATE task_proofs 
SET locationPoint = POINT(0, 0) 
WHERE locationPoint IS NULL;
```

## Recommendations
- For production with high-volume spatial queries: Use Option 2
- For flexibility with occasional spatial queries: Use Option 1 (current)
- Consider using a separate indexed column for "has_location" boolean to quickly filter records with actual locations vs defaults