# Scientific data contract (draft)

**No empirical population model is bundled.** The v0.1 morphs are manually designed and should never be cited as measurements.

## Requirements for future dataset integration

For each dataset record, document:

- Publication and dataset identifier, persistent URL/DOI and author.
- Source license, attribution requirements, reuse permission and informed-consent restrictions.
- Participant counts and sampling methodology for each population or region.
- Geographic definition of the sample (place of recruitment, ancestry, residence, etc.); these are not interchangeable.
- Sex, age and other covariates, processing adjustments and inclusion/exclusion criteria.
- Scan/registration protocol, template topology identifier, vertex count and coordinate system.
- Mean shape or statistical components and how weights were computed, plus variance/uncertainty estimates.
- Source limitations, missing data and permitted visualization claims.

## Geometry format

All morph targets must have matching vertex order and orientation. Suggested schema:

```json
{
  "schemaVersion": 1,
  "kind": "measured",
  "templateId": "source-and-topology-hash",
  "meshFile": "licensed/registered-meshes.glb",
  "source": { "title": "...", "doi": "...", "license": "..." },
  "sampling": { "description": "...", "n": 0 },
  "regions": [],
  "coordinateSystem": "right-handed, Y up, meters",
  "interpolationMethod": null
}
```

This is a proposed schema, not a claim that the referenced study supplies files in this form. A geographic selector should not imply that national borders define distinct or predictable facial types.

## Required guardrails

1. Clearly distinguish measured, interpolated and illustrative displays.
2. Do not assign synthetic average faces to countries or treat group statistics as an individual classification method.
3. Display source and sample sizes alongside measured results, and uncertainty where it is available.
4. Disable geographic morphing where source data cannot justify it. Do not manufacture missing coefficients.
5. Keep restricted individual facial scans out of the public repository.
